/**
 * Cleanup Command Handler
 *
 * Delete RBAC resources (roles, groups, workspaces) by prefix or glob pattern.
 * Designed for cleaning up test data after CI/CD runs.
 *
 * RULE: All API reads and mutations MUST go through typed API clients
 * (RolesApiClient, RolesV2ApiClient, GroupsApiClient, WorkspacesApiClient)
 * from the data layer. Direct axios calls (client.get, client.post, etc.)
 * are forbidden — they bypass type safety and drift silently when the API
 * contract changes.
 *
 * SAFETY RAILS:
 * 1. BLOCKED in production environments (unless dry-run)
 * 2. Prefix/pattern must be at least 4 characters (prevents mass deletion)
 *
 * Usage:
 *   rbac-cli cleanup --prefix "test-run-123__"
 *   rbac-cli cleanup --name-match "ci-*__test"
 *   rbac-cli cleanup --prefix "test__" --dry-run
 */

import { getApiClient, initializeApiClient } from '../api-client.js';
import { getToken } from '../auth.js';
import { getEnvConfig } from '../auth-bridge.js';
import { type PatternType, assertNotProduction, assertValidPattern } from './safety.js';
import {
  type GroupsApiClient,
  type RolesApiClient,
  type RolesV2ApiClient,
  type WorkspacesApiClient,
  createGroupsApi,
  createRolesApi,
  createRolesV2Api,
  createWorkspacesApi,
} from '../queries.js';

// ============================================================================
// Types
// ============================================================================

export interface CleanupOptions {
  prefix?: string;
  nameMatch?: string;
  dryRun?: boolean;
  apiVersion?: 'v1' | 'v2';
}

interface CleanupResult {
  success: boolean;
  roles: { deleted: number; failed: number };
  groups: { deleted: number; failed: number };
  workspaces: { deleted: number; failed: number };
  errors: string[];
}

interface Resource {
  uuid?: string;
  id?: string;
  name: string;
  display_name?: string;
  system?: boolean;
  platform_default?: boolean;
  type?: string;
  parent_id?: string | null;
  _apiVersion?: 'v1' | 'v2';
}

// ============================================================================
// Pattern Matching
// ============================================================================

/**
 * Simple glob pattern matcher.
 * Supports * (any characters) and ? (single character).
 */
function matchesGlob(name: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(name);
}

/**
 * Check if a resource matches the filter criteria.
 */
function matchesFilter(resource: Resource, prefix?: string, nameMatch?: string): boolean {
  const name = resource.display_name || resource.name;

  if (prefix) {
    return name.startsWith(prefix);
  }

  if (nameMatch) {
    return matchesGlob(name, nameMatch);
  }

  return false;
}

/**
 * Check if a resource is protected (system/default).
 */
function isProtected(resource: Resource): boolean {
  return resource.system === true || resource.platform_default === true || resource.type === 'root';
}

/**
 * Topologically sort workspaces so children are deleted before parents.
 * Uses parent_id from the API response to compute depth; deepest first.
 */
function sortChildrenFirst(workspaces: Resource[]): Resource[] {
  const byId = new Map(workspaces.map((w) => [w.id!, w]));

  function depth(ws: Resource): number {
    if (!ws.parent_id || !byId.has(ws.parent_id)) return 0;
    return 1 + depth(byId.get(ws.parent_id)!);
  }

  return [...workspaces].sort((a, b) => depth(b) - depth(a));
}

// ============================================================================
// API Operations — All reads/mutations go through typed API clients
// ============================================================================

/**
 * Fetch all V1 roles via the typed RolesApiClient.
 */
async function fetchRolesV1(rolesApi: RolesApiClient): Promise<Resource[]> {
  const roles: Resource[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await rolesApi.listRoles({ limit, offset });
    const data = (response.data?.data ?? []) as Resource[];
    roles.push(...data);

    if (data.length < limit) break;
    offset += limit;
  }

  return roles;
}

/**
 * Fetch all V2 roles via the typed RolesV2ApiClient.
 * Uses limit=-1 to retrieve all roles in a single request (same pattern as fetchWorkspaces).
 */
async function fetchRolesV2(rolesV2Api: RolesV2ApiClient): Promise<Resource[]> {
  // resource_type=workspace is required — without it the V2 endpoint returns a
  // restricted view that excludes roles with no active workspace bindings.
  const response = await rolesV2Api.rolesList({ limit: -1, options: { params: { resource_type: 'workspace' } } });
  const data = response.data?.data ?? [];
  const roles = data.map((role) => ({ ...role, id: role.id, name: role.name ?? '', _apiVersion: 'v2' as const }));
  if (process.env.DEBUG_CLI) {
    console.error(`  [DEBUG] V2 rolesList returned ${roles.length} role(s):`);
    for (const r of roles) console.error(`    - "${r.name}" (id: ${r.id})`);
  }
  return roles;
}

/**
 * Fetch roles from V1 and/or V2 APIs based on the target API version.
 *
 * - apiVersion 'v1': Only fetches V1 roles (skips V2 entirely).
 * - apiVersion 'v2' or undefined: Fetches both V1 and V2, deduplicates overlaps.
 *   V2 mode also scans V1 to catch roles that may have been created via V1 in prior
 *   runs (e.g. from a previous V1 seed that was never cleaned up). V1 roles are
 *   deleted via V1 API; V2-exclusive roles use V2 batch delete.
 */
async function fetchRoles(rolesApi: RolesApiClient, rolesV2Api: RolesV2ApiClient, apiVersion?: 'v1' | 'v2'): Promise<Resource[]> {
  if (apiVersion === 'v1') {
    const v1Roles = await fetchRolesV1(rolesApi);
    console.error(`  Fetched ${v1Roles.length} V1 role(s)`);
    return v1Roles;
  }

  const [v1Roles, v2Roles] = await Promise.all([fetchRolesV1(rolesApi), fetchRolesV2(rolesV2Api)]);

  const v1Names = new Set(v1Roles.map((r) => r.display_name || r.name));
  const v2Only = v2Roles.filter((r) => !v1Names.has(r.name));

  console.error(`  Fetched ${v1Roles.length} V1 role(s), ${v2Roles.length} V2 role(s) (${v2Only.length} V2-only)`);
  return [...v1Roles, ...v2Only];
}

/**
 * Fetch all groups via the typed GroupsApiClient.
 */
async function fetchGroups(groupsApi: GroupsApiClient): Promise<Resource[]> {
  const groups: Resource[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await groupsApi.listGroups({ limit, offset });
    const data = (response.data?.data ?? []) as Resource[];
    groups.push(...data);

    if (data.length < limit) break;
    offset += limit;
  }

  console.error(`  Fetched ${groups.length} total groups`);
  return groups;
}

/**
 * Fetch all workspaces via the typed WorkspacesApiClient.
 * Uses limit=-1 to fetch all in a single call.
 */
async function fetchWorkspaces(workspacesApi: WorkspacesApiClient): Promise<Resource[]> {
  const response = await workspacesApi.listWorkspaces({ limit: -1 });
  const workspaces = (response.data?.data ?? []) as Resource[];
  console.error(`  Fetched ${workspaces.length} total workspaces`);
  return workspaces;
}

/**
 * Delete a V1 role by UUID via the typed RolesApiClient.
 */
async function deleteRoleV1(rolesApi: RolesApiClient, uuid: string, name: string, errors: string[], dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    console.error(`  🔍 Would delete V1 role "${name}" (${uuid})`);
    return true;
  }

  try {
    await rolesApi.deleteRole({ uuid });
    console.error(`  ✓ Deleted V1 role "${name}"`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Role "${name}": ${message}`);
    console.error(`  ✗ Failed to delete V1 role "${name}": ${message}`);
    return false;
  }
}

/**
 * Delete a V2 role by ID via the typed RolesV2ApiClient (singular delete).
 */
async function deleteRoleV2(rolesV2Api: RolesV2ApiClient, id: string, name: string, errors: string[], dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    console.error(`  🔍 Would delete V2 role "${name}" (${id})`);
    return true;
  }

  try {
    await rolesV2Api.rolesBatchDelete({ rolesBatchDeleteRolesRequest: { ids: [id] } });
    console.error(`  ✓ Deleted V2 role "${name}"`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`V2 Role "${name}": ${message}`);
    console.error(`  ✗ Failed to delete V2 role "${name}": ${message}`);
    return false;
  }
}

/**
 * Delete a group by UUID via the typed GroupsApiClient.
 */
async function deleteGroupById(groupsApi: GroupsApiClient, uuid: string, name: string, errors: string[], dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    console.error(`  🔍 Would delete group "${name}" (${uuid})`);
    return true;
  }

  try {
    await groupsApi.deleteGroup({ uuid });
    console.error(`  ✓ Deleted group "${name}"`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Group "${name}": ${message}`);
    console.error(`  ✗ Failed to delete group "${name}": ${message}`);
    return false;
  }
}

/**
 * Delete a workspace by ID via the typed WorkspacesApiClient.
 */
async function deleteWorkspaceById(
  workspacesApi: WorkspacesApiClient,
  id: string,
  name: string,
  errors: string[],
  dryRun: boolean,
): Promise<boolean> {
  if (dryRun) {
    console.error(`  🔍 Would delete workspace "${name}" (${id})`);
    return true;
  }

  try {
    await workspacesApi.deleteWorkspace({ id });
    console.error(`  ✓ Deleted workspace "${name}"`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Workspace "${name}": ${message}`);
    console.error(`  ✗ Failed to delete workspace "${name}": ${message}`);
    return false;
  }
}

// ============================================================================
// Main Cleanup Logic
// ============================================================================

interface ApiClients {
  rolesApi: RolesApiClient;
  rolesV2Api: RolesV2ApiClient;
  groupsApi: GroupsApiClient;
  workspacesApi: WorkspacesApiClient;
}

/**
 * Execute cleanup operations.
 */
async function executeCleanup(
  clients: ApiClients,
  prefix?: string,
  nameMatch?: string,
  dryRun: boolean = false,
  apiVersion?: 'v1' | 'v2',
): Promise<CleanupResult> {
  const { rolesApi, rolesV2Api, groupsApi, workspacesApi } = clients;
  const result: CleanupResult = {
    success: true,
    roles: { deleted: 0, failed: 0 },
    groups: { deleted: 0, failed: 0 },
    workspaces: { deleted: 0, failed: 0 },
    errors: [],
  };

  const actionWord = dryRun ? 'Would delete' : 'Deleting';

  // Cleanup roles (V1 via individual delete, V2-only via singular batch delete)
  console.error(`\n🔍 Scanning roles...`);
  const roles = await fetchRoles(rolesApi, rolesV2Api, apiVersion);
  const matchingRoles = roles.filter((r) => matchesFilter(r, prefix, nameMatch) && !isProtected(r));
  console.error(`  Found ${matchingRoles.length} matching role(s)`);

  if (matchingRoles.length > 0) {
    console.error(`\n🗑️  ${actionWord} ${matchingRoles.length} role(s)...`);
    for (const role of matchingRoles) {
      const isV2 = role._apiVersion === 'v2';
      const name = role.display_name || role.name;
      const success = isV2
        ? await deleteRoleV2(rolesV2Api, role.id!, name, result.errors, dryRun)
        : await deleteRoleV1(rolesApi, role.uuid!, name, result.errors, dryRun);
      if (success) result.roles.deleted++;
      else result.roles.failed++;
    }
  }

  // Cleanup groups
  console.error(`\n🔍 Scanning groups...`);
  const groups = await fetchGroups(groupsApi);
  const matchingGroups = groups.filter((g) => matchesFilter(g, prefix, nameMatch) && !isProtected(g));
  console.error(`  Found ${matchingGroups.length} matching group(s)`);

  if (matchingGroups.length > 0) {
    console.error(`\n🗑️  ${actionWord} groups...`);
    for (const group of matchingGroups) {
      const success = await deleteGroupById(groupsApi, group.uuid!, group.name, result.errors, dryRun);
      if (success) {
        result.groups.deleted++;
      } else {
        result.groups.failed++;
      }
    }
  }

  // Cleanup workspaces (V2-only — skip entirely in V1 mode)
  if (apiVersion === 'v1') {
    console.error(`\n📋 Skipping workspaces (V1 mode)`);
  } else {
    console.error(`\n🔍 Scanning workspaces...`);
    const workspaces = await fetchWorkspaces(workspacesApi);
    const matchingWorkspaces = workspaces.filter((w) => matchesFilter(w, prefix, nameMatch) && !isProtected(w));
    console.error(`  Found ${matchingWorkspaces.length} matching workspace(s)`);

    if (matchingWorkspaces.length > 0) {
      const sorted = sortChildrenFirst(matchingWorkspaces);
      console.error(`\n🗑️  ${actionWord} workspaces...`);
      for (const workspace of sorted) {
        const success = await deleteWorkspaceById(workspacesApi, workspace.id!, workspace.name, result.errors, dryRun);
        if (success) {
          result.workspaces.deleted++;
        } else {
          result.workspaces.failed++;
        }
      }
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

// ============================================================================
// Command Handler
// ============================================================================

/**
 * Execute the cleanup command.
 *
 * @param options - Command options
 * @returns Exit code (0 for success, 1 for failure)
 */
export async function runCleanup(options: CleanupOptions): Promise<number> {
  try {
    // SAFETY RAIL 1: Block production (unless dry-run)
    if (!options.dryRun) {
      assertNotProduction('Cleanup');
    }

    // SAFETY RAIL 2: Validate pattern length
    const pattern = options.prefix || options.nameMatch;
    const patternType: PatternType = options.prefix ? 'prefix' : 'name-match';
    assertValidPattern(pattern, patternType, 'cleanup');

    const envConfig = getEnvConfig();
    const apiVersion = options.apiVersion;
    console.error(`\n🧹 RBAC Cleanup${options.dryRun ? ' [DRY-RUN MODE]' : ''}`);
    console.error(`━`.repeat(50));
    console.error(`Environment: ${envConfig.name}`);
    console.error(`API URL: ${envConfig.apiUrl}`);
    if (apiVersion) {
      console.error(`API Version: ${apiVersion}`);
    }
    if (options.prefix) {
      console.error(`Filter: prefix="${options.prefix}"`);
    }
    if (options.nameMatch) {
      console.error(`Filter: name-match="${options.nameMatch}"`);
    }
    if (options.dryRun) {
      console.error(`Mode: DRY-RUN (no changes will be made)`);
    }
    console.error(`━`.repeat(50));

    console.error(`\n🔐 Authenticating...`);

    // Always authenticate fresh - cleanup uses admin credentials from env, not cached token
    const token = await getToken({ skipCache: true });
    initializeApiClient(token);
    const client = getApiClient();

    console.error(`✓ Authenticated`);

    // Create typed API clients
    const clients: ApiClients = {
      rolesApi: createRolesApi(client),
      rolesV2Api: createRolesV2Api(client),
      groupsApi: createGroupsApi(client),
      workspacesApi: createWorkspacesApi(client),
    };

    // Execute cleanup
    const result = await executeCleanup(clients, options.prefix, options.nameMatch, options.dryRun, apiVersion, options.seedMapFile);

    // Output summary
    const totalDeleted = result.roles.deleted + result.groups.deleted + result.workspaces.deleted;
    const totalFailed = result.roles.failed + result.groups.failed + result.workspaces.failed;
    const actionWord = options.dryRun ? 'would be' : '';

    console.error(`\n${'━'.repeat(50)}`);
    console.error(`📊 Summary:`);
    console.error(`  Roles: ${result.roles.deleted} ${actionWord} deleted, ${result.roles.failed} failed`);
    console.error(`  Groups: ${result.groups.deleted} ${actionWord} deleted, ${result.groups.failed} failed`);
    console.error(`  Workspaces: ${result.workspaces.deleted} ${actionWord} deleted, ${result.workspaces.failed} failed`);
    console.error(`  Total: ${totalDeleted} ${actionWord} deleted, ${totalFailed} failed`);

    if (options.dryRun) {
      console.error(`\n✅ Dry-run completed. No changes were made.`);
      return 0;
    }

    if (result.success) {
      console.error(`\n✅ Cleanup completed successfully!`);
      return 0;
    } else {
      console.error(`\n⚠ Cleanup completed with ${result.errors.length} error(s)`);
      return 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ Cleanup failed: ${message}`);

    if (process.env.DEBUG_CLI) {
      console.error(error);
    }

    return 1;
  }
}

export default runCleanup;
