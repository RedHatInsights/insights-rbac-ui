/**
 * Seeder Command Handler
 *
 * Bulk create RBAC resources (roles, groups, workspaces) from JSON payload.
 * Supports prefix for test isolation and outputs name-to-UUID mapping.
 *
 * RULE: All API reads and mutations MUST go through typed API clients
 * (RolesApiClient, GroupsApiClient, WorkspacesApiClient) from the data layer.
 * Direct axios calls (client.get, client.post, etc.) are forbidden — they
 * bypass type safety and drift silently when the API contract changes.
 *
 * AUTOMATIC BEHAVIOR:
 * - System roles (system=true) are automatically fetched and included in seed-map
 * - System groups (platform_default=true) are automatically fetched and included
 * - Custom resources from the payload are created with the specified prefix
 *
 * SAFETY RAILS:
 * - BLOCKED in production environments (unless dry-run)
 *
 * Usage:
 *   rbac-cli seed --file payload.json --prefix "test-run-123"
 *   rbac-cli seed --file payload.json --prefix "ci" --json
 *   rbac-cli seed --file payload.json --dry-run
 */

import * as fs from 'fs/promises';
import type { AxiosInstance } from 'axios';
import { type GroupInput, type RoleBindingInput, type RoleInput, type SeedPayload, SeedPayloadSchema, type WorkspaceInput } from '../types.js';
import { getApiClient, initializeApiClient } from '../api-client.js';
import { getToken } from '../auth.js';
import { getEnvConfig } from '../auth-bridge.js';
import { assertNotProduction, assertValidPrefix } from './safety.js';
import {
  type GroupPrincipalIn,
  type GroupsApiClient,
  type RoleIn,
  type RolesApiClient,
  type RolesV2ApiClient,
  type V2Permission,
  type WorkspacesApiClient,
  createGroupsApi,
  createRolesApi,
  createRolesV2Api,
  createWorkspacesApi,
} from '../queries.js';

// ============================================================================
// Types
// ============================================================================

export interface SeederOptions {
  file: string;
  prefix?: string;
  json?: boolean;
  dryRun?: boolean;
  output?: string;
  apiVersion?: 'v1' | 'v2';
}

interface ResourceMapping {
  [originalName: string]: string; // originalName -> UUID (created or looked up)
}

interface SeederResult {
  roles: ResourceMapping;
  groups: ResourceMapping;
  workspaces: ResourceMapping;
  role_bindings: number;
}

// ============================================================================
// System Resource Discovery
// ============================================================================

interface SystemRole {
  uuid: string;
  name: string;
  display_name?: string;
  system: boolean;
}

interface SystemGroup {
  uuid: string;
  name: string;
  description?: string;
  platform_default?: boolean;
  admin_default?: boolean;
}

/**
 * Fetch all system roles from the API.
 * System roles have `system: true` and cannot be modified/deleted.
 */
async function fetchSystemRoles(rolesApi: RolesApiClient): Promise<SystemRole[]> {
  const allRoles: SystemRole[] = [];
  let offset = 0;
  const limit = 100;

  try {
    while (true) {
      const response = await rolesApi.listRoles({ system: true, limit, offset });
      const roles = (response.data?.data ?? []) as SystemRole[];
      allRoles.push(...roles);

      if (roles.length < limit) break;
      offset += limit;
    }

    return allRoles;
  } catch (error) {
    console.error('  ⚠ Could not fetch system roles:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

/**
 * Fetch all system/default groups from the API.
 * These include platform_default and admin_default groups.
 */
async function fetchSystemGroups(groupsApi: GroupsApiClient): Promise<SystemGroup[]> {
  const allGroups: SystemGroup[] = [];
  let offset = 0;
  const limit = 100;

  try {
    while (true) {
      const response = await groupsApi.listGroups({ system: true, limit, offset });
      const groups = (response.data?.data ?? []) as SystemGroup[];
      allGroups.push(...groups);

      if (groups.length < limit) break;
      offset += limit;
    }

    return allGroups;
  } catch (error) {
    console.error('  ⚠ Could not fetch system groups:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

// ============================================================================
// Payload Processing
// ============================================================================

/**
 * Read and validate JSON payload from file.
 */
export async function readPayload(filePath: string): Promise<SeedPayload> {
  let content: string;

  try {
    content = await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to read payload file "${filePath}": ${message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON in payload file "${filePath}"`);
  }

  const result = SeedPayloadSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`Invalid payload schema:\n${errors}`);
  }

  return result.data;
}

/**
 * Apply prefix to resource names using double-underscore separator.
 * All custom resources in the payload get prefixed.
 * Role references in groups are also prefixed to match.
 * Personas are passed through unchanged (they are real usernames).
 */
export function applyPrefix(payload: SeedPayload, prefix: string): SeedPayload {
  const separator = '__';

  return {
    roles: payload.roles?.map((role) => ({
      ...role,
      name: `${prefix}${separator}${role.name}`,
      display_name: role.display_name ? `${prefix}${separator}${role.display_name}` : undefined,
    })),
    groups: payload.groups?.map((group) => ({
      ...group,
      name: `${prefix}${separator}${group.name}`,
      // Also prefix role references so they match the created role names
      roles_list: group.roles_list?.map((roleName) => `${prefix}${separator}${roleName}`),
    })),
    workspaces: payload.workspaces?.map((workspace) => ({
      ...workspace,
      name: `${prefix}${separator}${workspace.name}`,
      parent_id: workspace.parent_id ? `${prefix}${separator}${workspace.parent_id}` : undefined,
    })),
    role_bindings: payload.role_bindings?.map((rb) => ({
      ...rb,
      group: `${prefix}${separator}${rb.group}`,
      role: `${prefix}${separator}${rb.role}`,
      workspace: `${prefix}${separator}${rb.workspace}`,
    })),
  };
}

// ============================================================================
// API Operations
// ============================================================================

/**
 * Create a role via the Roles API.
 *
 * Uses the typed RolesApiClient from src/v1/data/api/roles.ts.
 * Transforms the simpler `permissions: string[]` format to the V1 API's
 * `access: [{ permission: string, resourceDefinitions: [] }]` format.
 *
 * @throws Error if creation fails (caller should handle)
 */
async function createRole(rolesApi: RolesApiClient, role: RoleInput, mapping: ResourceMapping): Promise<void> {
  // Transform permissions array to V1 API access format
  const roleIn: RoleIn = {
    name: role.name,
    display_name: role.display_name,
    description: role.description,
    access: (role.permissions ?? []).map((p) => ({ permission: p, resourceDefinitions: [] })),
  };

  // Always log curl for debugging
  logCurl('POST', '/api/rbac/v1/roles/', roleIn, `Create role: ${role.name}`);

  const response = await rolesApi.createRole({ roleIn });
  const uuid = response.data?.uuid;
  if (uuid) {
    mapping[role.name] = uuid;
    console.error(`  ✓ Created role "${role.name}" → ${uuid}`);
  }
}

/**
 * Parse a V1 permission string ("app:resource:op") into a V2 Permission object.
 */
function parsePermission(perm: string): V2Permission {
  const [application, resource_type, operation] = perm.split(':');
  return { application, resource_type, operation };
}

/**
 * Create a role via the V2 Roles API.
 *
 * Transforms the simpler `permissions: string[]` format to the V2 API's
 * `permissions: [{ application, resource_type, operation }]` format.
 *
 * @throws Error if creation fails (caller should handle)
 */
async function createRoleV2(rolesV2Api: RolesV2ApiClient, role: RoleInput, mapping: ResourceMapping): Promise<void> {
  const permissions = (role.permissions ?? []).map(parsePermission);
  const request = {
    name: role.name,
    description: role.description ?? '',
    permissions,
  };

  logCurl('POST', '/api/rbac/v2/roles/', request, `Create role: ${role.name}`);

  const response = await rolesV2Api.rolesCreate({ rolesCreateOrUpdateRoleRequest: request });
  const id = response.data?.id;
  if (id) {
    mapping[role.name] = id;
    console.error(`  ✓ Created role "${role.name}" → ${id}`);
  }
}

/**
 * Create a group via the Groups API and optionally attach roles and members.
 *
 * Uses the typed GroupsApiClient from src/shared/data/api/groups.ts.
 * If roles_list is provided, resolves role names to UUIDs and attaches them.
 * If user_list is provided, adds those users as members.
 *
 * @throws Error if creation fails (caller should handle)
 */
async function createGroup(
  groupsApi: GroupsApiClient,
  group: GroupInput,
  mapping: ResourceMapping,
  roleMapping: ResourceMapping,
  options?: { attachRoles?: boolean },
): Promise<void> {
  const attachRoles = options?.attachRoles ?? true;
  const groupData = {
    name: group.name,
    description: group.description,
  };

  // Always log curl for debugging
  logCurl('POST', '/api/rbac/v1/groups/', groupData, `Create group: ${group.name}`);

  const response = await groupsApi.createGroup({ group: groupData });
  const uuid = response.data?.uuid;
  if (uuid) {
    mapping[group.name] = uuid;
    console.error(`  ✓ Created group "${group.name}" → ${uuid}`);

    // Attach roles if specified (V1 only — V2 uses role bindings instead)
    if (attachRoles && group.roles_list && group.roles_list.length > 0) {
      const roleUuids: string[] = [];
      for (const roleName of group.roles_list) {
        // Try to find the role UUID - check both prefixed and unprefixed names
        const roleUuid = roleMapping[roleName];
        if (roleUuid) {
          roleUuids.push(roleUuid);
        } else {
          console.error(`    ⚠ Role "${roleName}" not found in role mapping, skipping`);
        }
      }

      if (roleUuids.length > 0) {
        logCurl('POST', `/api/rbac/v1/groups/${uuid}/roles/`, { roles: roleUuids }, `Attach ${roleUuids.length} role(s) to group`);
        await groupsApi.addRoleToGroup({ uuid, groupRoleIn: { roles: roleUuids } });
        console.error(`    ✓ Attached ${roleUuids.length} role(s) to group`);
      }
    }

    // Add explicit user_list members (defined per-group in the seed fixture)
    if (group.user_list && group.user_list.length > 0) {
      const usernames = group.user_list.map((u) => u.username);
      const principalData = { principals: usernames.map((username) => ({ username })) };
      logCurl('POST', `/api/rbac/v1/groups/${uuid}/principals/`, principalData, `Add ${usernames.length} member(s) to group`);
      try {
        await groupsApi.addPrincipalToGroup({
          uuid,
          groupPrincipalIn: principalData as GroupPrincipalIn,
        });
        console.error(`    ✓ Added ${usernames.length} member(s) to group: ${usernames.join(', ')}`);
      } catch (error) {
        // Don't fail if users are already in group or other non-critical error
        console.error(`    ⚠ Could not add members to group: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
}

/**
 * Create a workspace via the typed V2 API client.
 *
 * @throws Error if creation fails (caller should handle)
 */
async function createWorkspace(
  workspacesApi: WorkspacesApiClient,
  workspace: WorkspaceInput,
  mapping: ResourceMapping,
  rootWorkspaceId?: string,
): Promise<void> {
  const request = {
    name: workspace.name,
    description: workspace.description,
    parent_id: mapping[workspace.parent_id!] ?? workspace.parent_id ?? rootWorkspaceId,
  };

  logCurl('POST', '/api/rbac/v2/workspaces/', request, `Create workspace: ${workspace.name}`);

  const response = await workspacesApi.createWorkspace({ workspacesCreateWorkspaceRequest: request });
  const id = response.data?.id;
  if (id) {
    mapping[workspace.name] = id;
    console.error(`  ✓ Created workspace "${workspace.name}" → ${id}`);
  }
}

/**
 * Create role bindings via the typed V2 API client (PUT /role-bindings/by-subject/).
 *
 * Resolves group, role, and workspace names to UUIDs from the seeder mappings,
 * then sets role bindings for each group+workspace pair. Groups bindings by
 * (group, workspace) to send one PUT per pair with all applicable roles.
 */
async function createRoleBindings(
  workspacesApi: WorkspacesApiClient,
  bindings: RoleBindingInput[],
  mappings: { roles: ResourceMapping; groups: ResourceMapping; workspaces: ResourceMapping },
): Promise<number> {
  // Group bindings by (group, workspace) so we send one PUT per pair
  const bySubject = new Map<string, { groupId: string; workspaceId: string; roleIds: string[]; label: string }>();

  for (const binding of bindings) {
    const groupId = mappings.groups[binding.group];
    const roleId = mappings.roles[binding.role];
    const workspaceId = mappings.workspaces[binding.workspace];

    if (!groupId) {
      console.error(`    ⚠ Group "${binding.group}" not found in mapping, skipping binding`);
      continue;
    }
    if (!roleId) {
      console.error(`    ⚠ Role "${binding.role}" not found in mapping, skipping binding`);
      continue;
    }
    if (!workspaceId) {
      console.error(`    ⚠ Workspace "${binding.workspace}" not found in mapping, skipping binding`);
      continue;
    }

    const key = `${groupId}:${workspaceId}`;
    const existing = bySubject.get(key);
    if (existing) {
      existing.roleIds.push(roleId);
    } else {
      bySubject.set(key, { groupId, workspaceId, roleIds: [roleId], label: `${binding.group} → ${binding.workspace}` });
    }
  }

  if (bySubject.size === 0) {
    console.error(`    ⚠ No valid role bindings to create`);
    return 0;
  }

  let count = 0;
  for (const { groupId, workspaceId, roleIds, label } of bySubject.values()) {
    const roles = roleIds.map((id) => ({ id }));
    logCurl(
      'PUT',
      `/api/rbac/v2/role-bindings/by-subject/?resource_id=${workspaceId}&resource_type=workspace&subject_id=${groupId}&subject_type=group`,
      { roles },
      `Bind ${label}`,
    );

    await workspacesApi.roleBindingsUpdate({
      resourceId: workspaceId,
      resourceType: 'workspace',
      subjectId: groupId,
      subjectType: 'group',
      roleBindingsUpdateRoleBindingsRequest: { roles },
    });
    count += roleIds.length;
    console.error(`  ✓ Bound ${roleIds.length} role(s) for ${label}`);
  }

  return count;
}

/**
 * Fetch root workspace ID for creating child workspaces.
 */
async function fetchRootWorkspaceId(workspacesApi: WorkspacesApiClient): Promise<string | undefined> {
  try {
    const response = await workspacesApi.listWorkspaces({ type: 'root' });
    return response.data?.data?.[0]?.id;
  } catch {
    console.error('  ⚠ Could not fetch root workspace');
    return undefined;
  }
}

/**
 * Fetch Default workspace ID for creating child workspaces.
 * The Default workspace is a better place for test workspaces than root.
 */
async function fetchDefaultWorkspaceId(workspacesApi: WorkspacesApiClient): Promise<string | undefined> {
  try {
    const response = await workspacesApi.listWorkspaces({ type: 'default' });
    return response.data?.data?.[0]?.id;
  } catch {
    console.error('  ⚠ Could not fetch default workspace');
    return undefined;
  }
}

// ============================================================================
// Logging Helpers
// ============================================================================

/**
 * Log curl command for debugging.
 * Always outputs to stderr (keeps stdout clean for JSON output).
 */
function logCurl(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: unknown, description?: string): void {
  const baseUrl = getEnvConfig().apiUrl;
  const url = `${baseUrl}${endpoint}`;

  if (description) {
    console.error(`  → ${description}`);
  }

  let curlCmd = `    curl -X ${method} '${url}'`;
  curlCmd += ` \\\n      -H 'Authorization: Bearer $TOKEN'`;
  curlCmd += ` \\\n      -H 'Accept: application/json'`;

  if (data) {
    curlCmd += ` \\\n      -H 'Content-Type: application/json'`;
    curlCmd += ` \\\n      -d '${JSON.stringify(data)}'`;
  }

  console.error(curlCmd);
  console.error('');
}

// ============================================================================
// Main Seeder Logic
// ============================================================================

interface ExecuteSeedOptions {
  dryRun?: boolean;
  apiVersion: 'v1' | 'v2';
}

/**
 * Execute seeding operations:
 *
 * Phase 1: Discover - Fetch all system roles/groups from the API (ALWAYS runs)
 * Phase 2: Create - Create custom resources from the payload (skipped in dry-run)
 * Phase 3: Bind - Create role bindings between groups, roles, and workspaces
 *
 * System resources are automatically included in the seed-map for reference.
 * In dry-run mode, discovery still happens but mutations are skipped and curl commands are output.
 */
async function executeSeed(payload: SeedPayload, client: AxiosInstance, options: ExecuteSeedOptions): Promise<SeederResult> {
  const { dryRun = false, apiVersion } = options;
  const isV2 = apiVersion === 'v2';

  // Create typed API clients — all reads and mutations go through these
  const rolesApi = createRolesApi(client);
  const rolesV2Api = isV2 ? createRolesV2Api(client) : undefined;
  const groupsApi = createGroupsApi(client);
  const workspacesApi = createWorkspacesApi(client);

  const result: SeederResult = {
    roles: {},
    groups: {},
    workspaces: {},
    role_bindings: 0,
  };

  // ============================================================================
  // PHASE 1: DISCOVER - Fetch all system roles and groups (ALWAYS runs)
  // ============================================================================
  console.error(`\n${'━'.repeat(50)}`);
  console.error(`🔍 PHASE 1: Discovering system resources`);
  console.error(`${'━'.repeat(50)}`);

  // Fetch all system roles (V1 only — V2 has no system role concept)
  if (!isV2) {
    console.error(`\n🔍 Fetching system roles...`);
    const systemRoles = await fetchSystemRoles(rolesApi);
    for (const role of systemRoles) {
      result.roles[role.name] = role.uuid;
    }
    console.error(`  ✓ Found ${systemRoles.length} system role(s)`);
  } else {
    console.error(`\n📋 Skipping system roles discovery (V2 API)`);
  }

  // Fetch all system/default groups
  console.error(`\n🔍 Fetching system groups...`);
  const systemGroups = await fetchSystemGroups(groupsApi);
  for (const group of systemGroups) {
    result.groups[group.name] = group.uuid;
  }
  console.error(`  ✓ Found ${systemGroups.length} system group(s)`);

  // ============================================================================
  // PHASE 2: CREATE - Create custom resources from payload
  // ============================================================================
  const customRoles = payload.roles ?? [];
  const customGroups = payload.groups ?? [];
  const workspaces = payload.workspaces ?? [];
  const roleBindings = payload.role_bindings ?? [];
  const customResourceCount = customRoles.length + customGroups.length + workspaces.length + roleBindings.length;

  if (customResourceCount === 0) {
    console.error(`\n📋 No custom resources to create.`);
    return result;
  }

  console.error(`\n${'━'.repeat(50)}`);
  console.error(`📦 PHASE 2: ${dryRun ? 'Would create' : 'Creating'} ${customResourceCount} custom resource(s)`);
  console.error(`${'━'.repeat(50)}`);

  // DRY-RUN: Output curl commands instead of making API calls
  if (dryRun) {
    console.error(`\n📋 Dry-run mode: no mutations will be performed\n`);

    // Output role curl commands
    if (customRoles.length > 0) {
      console.error(`📦 Would create ${customRoles.length} role(s) via ${isV2 ? 'V2' : 'V1'} API...`);
      for (const role of customRoles) {
        result.roles[role.name] = '<dry-run>';
        if (isV2) {
          const payload = { name: role.name, description: role.description ?? '', permissions: (role.permissions ?? []).map(parsePermission) };
          logCurl('POST', '/api/rbac/v2/roles/', payload, `Create role: ${role.name}`);
        } else {
          const payload = {
            name: role.name,
            display_name: role.display_name,
            description: role.description,
            access: (role.permissions ?? []).map((p) => ({ permission: p, resourceDefinitions: [] })),
          };
          logCurl('POST', '/api/rbac/v1/roles/', payload, `Create role: ${role.name}`);
        }
      }
    }

    // Output group curl commands
    if (customGroups.length > 0) {
      console.error(`📦 Would create ${customGroups.length} group(s)...`);
      for (const group of customGroups) {
        result.groups[group.name] = '<dry-run>';
        logCurl('POST', '/api/rbac/v1/groups/', { name: group.name, description: group.description }, `Create group: ${group.name}`);
      }
    }

    // Output workspace curl commands
    if (workspaces.length > 0) {
      console.error(`📦 Would create ${workspaces.length} workspace(s)...`);
      for (const workspace of workspaces) {
        result.workspaces[workspace.name] = '<dry-run>';
        logCurl(
          'POST',
          '/api/rbac/v2/workspaces/',
          { name: workspace.name, description: workspace.description, parent_id: workspace.parent_id || '<root>' },
          `Create workspace: ${workspace.name}`,
        );
      }
    }

    // Output role binding curl commands
    if (roleBindings.length > 0) {
      console.error(`📦 Would create ${roleBindings.length} role binding(s)...`);
      result.role_bindings = roleBindings.length;
      for (const rb of roleBindings) {
        const params = `resource_id=<${rb.workspace}>&resource_type=workspace&subject_id=<${rb.group}>&subject_type=group`;
        logCurl('PUT', `/api/rbac/v2/role-bindings/by-subject/?${params}`, { roles: [{ id: `<${rb.role}>` }] }, `Bind ${rb.group} → ${rb.workspace}`);
      }
    }

    return result;
  }

  // LIVE MODE: Actually create resources using typed API clients

  // Create custom roles (sequentially, bail on first error)
  if (customRoles.length > 0) {
    console.error(`\n📦 Creating ${customRoles.length} role(s) via ${isV2 ? 'V2' : 'V1'} API...`);
    for (const role of customRoles) {
      if (isV2 && rolesV2Api) {
        await createRoleV2(rolesV2Api, role, result.roles);
      } else {
        await createRole(rolesApi, role, result.roles);
      }
    }
  }

  // Create custom groups (sequentially, bail on first error)
  if (customGroups.length > 0) {
    console.error(`\n📦 Creating ${customGroups.length} group(s)...`);
    for (const group of customGroups) {
      await createGroup(groupsApi, group, result.groups, result.roles, { attachRoles: !isV2 });
    }
  }

  // Create workspaces (sequentially, bail on first error)
  // Create under Default workspace (not root) for better organization
  if (workspaces.length > 0) {
    console.error(`\n📦 Creating ${workspaces.length} workspace(s)...`);
    let parentWorkspaceId = await fetchDefaultWorkspaceId(workspacesApi);
    if (!parentWorkspaceId) {
      console.error('  ⚠ Default workspace not found, falling back to root');
      parentWorkspaceId = await fetchRootWorkspaceId(workspacesApi);
    } else {
      console.error(`  → Using Default workspace as parent: ${parentWorkspaceId}`);
    }
    for (const workspace of workspaces) {
      await createWorkspace(workspacesApi, workspace, result.workspaces, parentWorkspaceId);
    }
  }

  // ============================================================================
  // PHASE 3: BIND - Create role bindings (needs UUIDs from phases above)
  // ============================================================================
  if (roleBindings.length > 0) {
    console.error(`\n${'━'.repeat(50)}`);
    console.error(`🔗 PHASE 3: Creating ${roleBindings.length} role binding(s)`);
    console.error(`${'━'.repeat(50)}`);
    result.role_bindings = await createRoleBindings(workspacesApi, roleBindings, {
      roles: result.roles,
      groups: result.groups,
      workspaces: result.workspaces,
    });
  }

  return result;
}

// ============================================================================
// Command Handler
// ============================================================================

/**
 * Execute the seed command.
 *
 * @param options - Command options
 * @returns Exit code (0 for success, 1 for failure)
 */
export async function runSeeder(options: SeederOptions): Promise<number> {
  try {
    // SAFETY RAILS
    if (!options.dryRun) {
      assertNotProduction('Seeding');
    }
    const prefix = assertValidPrefix(options.prefix, 'seed');

    const envConfig = getEnvConfig();
    const separator = '__';

    const apiVersion = options.apiVersion ?? 'v1';

    console.error(`\n🌱 RBAC Seeder${options.dryRun ? ' [DRY-RUN MODE]' : ''}`);
    console.error(`━`.repeat(50));
    console.error(`Environment: ${envConfig.name}`);
    console.error(`API URL: ${envConfig.apiUrl}`);
    console.error(`API Version: ${apiVersion}`);
    console.error(`Payload: ${options.file}`);
    console.error(`Prefix: "${prefix}" (separator: "${separator}")`);
    if (apiVersion === 'v1') {
      console.error(`\n📋 System roles/groups will be auto-discovered and included in seed-map.`);
    } else {
      console.error(`\n📋 System groups will be auto-discovered. Roles use V2 API.`);
    }
    if (options.dryRun) {
      console.error(`📋 Dry-run mode: discovery will run, but no mutations will be performed.`);
    }
    console.error(`━`.repeat(50));

    // Read and validate payload
    let payload = await readPayload(options.file);

    // Apply prefix (required and validated above)
    payload = applyPrefix(payload, prefix);

    // Authenticate (needed for both dry-run and live mode)
    console.error(`\n🔐 Authenticating...`);
    // Always authenticate fresh - seeder uses admin credentials from env, not cached token
    const token = await getToken({ skipCache: true });
    initializeApiClient(token);
    const client = getApiClient();
    console.error(`✓ Authenticated`);

    // Execute seeding (discovery always runs, mutations skipped in dry-run)
    const result = await executeSeed(payload, client, { dryRun: options.dryRun, apiVersion });

    // Output summary
    console.error(`\n${'━'.repeat(50)}`);
    console.error(`📊 Summary${options.dryRun ? ' (dry-run)' : ''}:`);
    console.error(`  Roles: ${Object.keys(result.roles).length} ${options.dryRun ? 'discovered/would-create' : 'processed'}`);
    console.error(`  Groups: ${Object.keys(result.groups).length} ${options.dryRun ? 'discovered/would-create' : 'processed'}`);
    console.error(`  Workspaces: ${Object.keys(result.workspaces).length} ${options.dryRun ? 'discovered/would-create' : 'processed'}`);
    if (result.role_bindings > 0) {
      console.error(`  Role bindings: ${result.role_bindings} ${options.dryRun ? 'would-create' : 'created'}`);
    }

    // Output JSON mapping if requested
    if (options.json) {
      const mapping = {
        roles: result.roles,
        groups: result.groups,
        workspaces: result.workspaces,
      };
      const jsonOutput = JSON.stringify(mapping, null, 2);

      if (options.output) {
        // Write to file
        await fs.writeFile(options.output, jsonOutput, 'utf-8');
        console.error(`\n📄 Seed map written to: ${options.output}`);
      } else {
        // Write to stdout
        console.log(jsonOutput);
      }
    }

    if (options.dryRun) {
      console.error(`\n✅ Dry-run completed. No mutations were performed.`);
    } else {
      console.error(`\n✅ Seeding completed successfully!`);
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n❌ Seeder failed: ${message}`);

    if (process.env.DEBUG_CLI) {
      console.error(error);
    }

    return 1;
  }
}

export default runSeeder;
