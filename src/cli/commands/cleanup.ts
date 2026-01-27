/**
 * Cleanup Command Handler
 *
 * Delete RBAC resources (roles, groups, workspaces) by prefix or glob pattern.
 * Designed for cleaning up test data after CI/CD runs.
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

import type { AxiosInstance } from 'axios';
import { getApiClient, initializeApiClient } from '../api-client.js';
import { getToken } from '../auth.js';
import { getEnvConfig } from '../auth-bridge.js';
import { assertNotProduction, assertValidPattern, type PatternType } from './safety.js';

// ============================================================================
// Types
// ============================================================================

export interface CleanupOptions {
  prefix?: string;
  nameMatch?: string;
  dryRun?: boolean;
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
}

// ============================================================================
// Pattern Matching
// ============================================================================

/**
 * Simple glob pattern matcher.
 * Supports * (any characters) and ? (single character).
 */
function matchesGlob(name: string, pattern: string): boolean {
  // Convert glob to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
    .replace(/\*/g, '.*') // * -> .*
    .replace(/\?/g, '.'); // ? -> .

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

// ============================================================================
// API Operations
// ============================================================================

/**
 * Fetch all roles from API.
 */
async function fetchRoles(client: AxiosInstance): Promise<Resource[]> {
  const roles: Resource[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await client.get('/api/rbac/v1/roles/', {
      params: { limit, offset },
    });

    const data = response.data?.data ?? [];
    roles.push(...data);

    if (data.length < limit) break;
    offset += limit;
  }

  console.error(`  Fetched ${roles.length} total roles`);
  return roles;
}

/**
 * Fetch all groups from API.
 */
async function fetchGroups(client: AxiosInstance): Promise<Resource[]> {
  const groups: Resource[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await client.get('/api/rbac/v1/groups/', {
      params: { limit, offset },
    });

    const data = response.data?.data ?? [];
    groups.push(...data);

    if (data.length < limit) break;
    offset += limit;
  }

  console.error(`  Fetched ${groups.length} total groups`);
  return groups;
}

/**
 * Fetch all workspaces from API.
 * Uses limit=-1 to fetch all in a single call.
 */
async function fetchWorkspaces(client: AxiosInstance): Promise<Resource[]> {
  const response = await client.get('/api/rbac/v2/workspaces/', {
    params: { limit: -1 },
  });

  const workspaces = response.data?.data ?? [];
  console.error(`  Fetched ${workspaces.length} total workspaces`);
  return workspaces;
}

/**
 * Delete a role by UUID.
 */
async function deleteRole(client: AxiosInstance, uuid: string, name: string, errors: string[], dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    console.error(`  🔍 Would delete role "${name}" (${uuid})`);
    return true;
  }

  try {
    await client.delete(`/api/rbac/v1/roles/${uuid}/`);
    console.error(`  ✓ Deleted role "${name}"`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Role "${name}": ${message}`);
    console.error(`  ✗ Failed to delete role "${name}": ${message}`);
    return false;
  }
}

/**
 * Delete a group by UUID.
 */
async function deleteGroup(client: AxiosInstance, uuid: string, name: string, errors: string[], dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    console.error(`  🔍 Would delete group "${name}" (${uuid})`);
    return true;
  }

  try {
    await client.delete(`/api/rbac/v1/groups/${uuid}/`);
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
 * Delete a workspace by ID.
 */
async function deleteWorkspace(client: AxiosInstance, id: string, name: string, errors: string[], dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    console.error(`  🔍 Would delete workspace "${name}" (${id})`);
    return true;
  }

  try {
    await client.delete(`/api/rbac/v2/workspaces/${id}/`);
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

/**
 * Execute cleanup operations.
 */
async function executeCleanup(client: AxiosInstance, prefix?: string, nameMatch?: string, dryRun: boolean = false): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    roles: { deleted: 0, failed: 0 },
    groups: { deleted: 0, failed: 0 },
    workspaces: { deleted: 0, failed: 0 },
    errors: [],
  };

  const actionWord = dryRun ? 'Would delete' : 'Deleting';

  // Cleanup roles
  console.error(`\n🔍 Scanning roles...`);
  const roles = await fetchRoles(client);
  const matchingRoles = roles.filter((r) => matchesFilter(r, prefix, nameMatch) && !isProtected(r));
  console.error(`  Found ${matchingRoles.length} matching role(s)`);

  if (matchingRoles.length > 0) {
    console.error(`\n🗑️  ${actionWord} roles...`);
    for (const role of matchingRoles) {
      const success = await deleteRole(client, role.uuid!, role.display_name || role.name, result.errors, dryRun);
      if (success) {
        result.roles.deleted++;
      } else {
        result.roles.failed++;
      }
    }
  }

  // Cleanup groups
  console.error(`\n🔍 Scanning groups...`);
  const groups = await fetchGroups(client);
  const matchingGroups = groups.filter((g) => matchesFilter(g, prefix, nameMatch) && !isProtected(g));
  console.error(`  Found ${matchingGroups.length} matching group(s)`);

  if (matchingGroups.length > 0) {
    console.error(`\n🗑️  ${actionWord} groups...`);
    for (const group of matchingGroups) {
      const success = await deleteGroup(client, group.uuid!, group.name, result.errors, dryRun);
      if (success) {
        result.groups.deleted++;
      } else {
        result.groups.failed++;
      }
    }
  }

  // Cleanup workspaces (delete in reverse order to handle children first)
  console.error(`\n🔍 Scanning workspaces...`);
  const workspaces = await fetchWorkspaces(client);
  const matchingWorkspaces = workspaces.filter((w) => matchesFilter(w, prefix, nameMatch) && !isProtected(w));
  console.error(`  Found ${matchingWorkspaces.length} matching workspace(s)`);

  if (matchingWorkspaces.length > 0) {
    console.error(`\n🗑️  ${actionWord} workspaces...`);
    // Reverse to delete children before parents
    for (const workspace of matchingWorkspaces.reverse()) {
      const success = await deleteWorkspace(client, workspace.id!, workspace.name, result.errors, dryRun);
      if (success) {
        result.workspaces.deleted++;
      } else {
        result.workspaces.failed++;
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
    console.error(`\n🧹 RBAC Cleanup${options.dryRun ? ' [DRY-RUN MODE]' : ''}`);
    console.error(`━`.repeat(50));
    console.error(`Environment: ${envConfig.name}`);
    console.error(`API URL: ${envConfig.apiUrl}`);
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

    // Get token and initialize API client
    const token = await getToken();
    initializeApiClient(token);
    const client = getApiClient();

    console.error(`✓ Authenticated`);

    // Execute cleanup
    const result = await executeCleanup(client, options.prefix, options.nameMatch, options.dryRun);

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
