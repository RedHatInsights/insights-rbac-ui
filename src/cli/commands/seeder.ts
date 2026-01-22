/**
 * Seeder Command Handler
 *
 * Bulk create RBAC resources (roles, groups, workspaces) from JSON payload.
 * Supports prefix for test isolation and outputs name-to-UUID mapping.
 *
 * SAFETY RAILS:
 * 1. BLOCKED in production environments (unless dry-run)
 * 2. System defaults are looked up, not created
 *
 * GROUND TRUTH (from rbac-config/insights-rbac):
 * - System roles: Organization Administrator, User Access Administrator, Viewer, Auditor, Cost Administrator
 * - System groups: Default admin access group, Default access group
 * - Roles with `system: true` cannot be modified or deleted via API
 * - Roles with `admin_default: true` are auto-granted to Org Admins
 * - API requires `permissions` array with objects: { application, resource_type, operation }
 *
 * Usage:
 *   rbac-cli seed --file payload.json --prefix "test-run-123"
 *   rbac-cli seed --file payload.json --prefix "ci" --json
 *   rbac-cli seed --file payload.json --dry-run
 */

import * as fs from 'fs/promises';
import type { AxiosInstance } from 'axios';
import { SeedPayloadSchema, type SeedPayload, type RoleInput, type GroupInput, type WorkspaceInput } from '../types.js';
import { getApiClient, initializeApiClient } from '../api-client.js';
import { getToken } from '../auth.js';
import { getCurrentEnv, getEnvConfig } from '../auth-bridge.js';

// ============================================================================
// Types
// ============================================================================

export interface SeederOptions {
  file: string;
  prefix?: string;
  json?: boolean;
  dryRun?: boolean;
}

interface ResourceMapping {
  [originalName: string]: string; // originalName -> UUID (created or looked up)
}

interface SeederResult {
  success: boolean;
  roles: ResourceMapping;
  groups: ResourceMapping;
  workspaces: ResourceMapping;
  errors: string[];
}

// ============================================================================
// System Defaults - Resources that should be looked up, not created
// ============================================================================

/**
 * System default roles that exist in every environment.
 * These will be looked up via API instead of created.
 *
 * Ground Truth from rbac-config (Stage configuration):
 * - Roles with `system: true` cannot be modified or deleted via API
 * - Roles with `admin_default: true` are auto-granted to Org Admins
 */
const SYSTEM_DEFAULT_ROLES = [
  'Organization Administrator',
  'User Access Administrator',
  'Viewer',
  'Auditor',
  'Cost Administrator',
];

/**
 * System default groups that exist in every environment.
 * These will be looked up via API instead of created.
 *
 * Ground Truth from rbac-config:
 * - `Default admin access group`: Auto-maintained for Org Admins, contains roles like "User Access Administrator"
 * - `Default access group`: Standard group for all authenticated users
 */
const SYSTEM_DEFAULT_GROUPS = [
  'Default admin access group',
  'Default access group',
];

/**
 * Check if a role is a system default.
 */
function isSystemDefaultRole(name: string): boolean {
  return SYSTEM_DEFAULT_ROLES.includes(name);
}

/**
 * Check if a group is a system default.
 */
function isSystemDefaultGroup(name: string): boolean {
  return SYSTEM_DEFAULT_GROUPS.includes(name);
}

// ============================================================================
// Safety Rails
// ============================================================================

/**
 * CRITICAL: Block seeding in production environments.
 * This prevents accidental data creation in production via CI/CD.
 */
function assertNotProduction(): void {
  const env = getCurrentEnv();
  const envLower = env.toLowerCase();

  if (envLower === 'prod' || envLower === 'production') {
    throw new Error(
      'Seeding is not allowed in production via headless mode.\n' +
        'This safety rail prevents accidental data creation in production.\n' +
        'Set RBAC_ENV=stage to use the seeder.',
    );
  }
}

// ============================================================================
// Payload Processing
// ============================================================================

/**
 * Read and validate JSON payload from file.
 */
async function readPayload(filePath: string): Promise<SeedPayload> {
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
 * System defaults are NOT prefixed - they keep their original names.
 */
function applyPrefix(payload: SeedPayload, prefix: string): SeedPayload {
  const separator = '__';

  return {
    roles: payload.roles?.map((role) => {
      // Don't prefix system defaults
      if (isSystemDefaultRole(role.name)) {
        return role;
      }
      return {
        ...role,
        name: `${prefix}${separator}${role.name}`,
        display_name: role.display_name ? `${prefix}${separator}${role.display_name}` : undefined,
      };
    }),
    groups: payload.groups?.map((group) => {
      // Don't prefix system defaults
      if (isSystemDefaultGroup(group.name)) {
        return group;
      }
      return {
        ...group,
        name: `${prefix}${separator}${group.name}`,
      };
    }),
    workspaces: payload.workspaces?.map((workspace) => ({
      ...workspace,
      name: `${prefix}${separator}${workspace.name}`,
    })),
  };
}

// ============================================================================
// API Operations
// ============================================================================

/**
 * Simple concurrency limiter.
 * Runs async functions with a maximum number of concurrent executions.
 */
async function withConcurrencyLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = fn(item).then((result) => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      // Remove completed promises
      const completed = executing.filter((p) => {
        let resolved = false;
        p.then(() => (resolved = true)).catch(() => (resolved = true));
        return resolved;
      });
      completed.forEach((p) => {
        const index = executing.indexOf(p);
        if (index > -1) executing.splice(index, 1);
      });
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Look up an existing role by name.
 */
async function lookupRole(
  client: AxiosInstance,
  name: string,
  mapping: ResourceMapping,
  errors: string[],
): Promise<void> {
  try {
    const response = await client.get('/api/rbac/v1/roles/', {
      params: { name },
    });
    const role = response.data?.data?.[0];
    if (role?.uuid) {
      mapping[name] = role.uuid;
      console.error(`  🔍 Looked up system role "${name}" → ${role.uuid}`);
    } else {
      errors.push(`System role "${name}": Not found`);
      console.error(`  ⚠ System role "${name}" not found`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`System role "${name}": ${message}`);
    console.error(`  ✗ Failed to lookup role "${name}": ${message}`);
  }
}

/**
 * Look up an existing group by name.
 */
async function lookupGroup(
  client: AxiosInstance,
  name: string,
  mapping: ResourceMapping,
  errors: string[],
): Promise<void> {
  try {
    const response = await client.get('/api/rbac/v1/groups/', {
      params: { name },
    });
    const group = response.data?.data?.[0];
    if (group?.uuid) {
      mapping[name] = group.uuid;
      console.error(`  🔍 Looked up system group "${name}" → ${group.uuid}`);
    } else {
      errors.push(`System group "${name}": Not found`);
      console.error(`  ⚠ System group "${name}" not found`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`System group "${name}": ${message}`);
    console.error(`  ✗ Failed to lookup group "${name}": ${message}`);
  }
}

/**
 * Create a role via API.
 *
 * Transforms the simpler `permissions: string[]` format to the V1 API's
 * `access: [{ permission: string }]` format.
 */
async function createRole(
  client: AxiosInstance,
  role: RoleInput,
  mapping: ResourceMapping,
  errors: string[],
): Promise<void> {
  try {
    // Transform permissions array to V1 API access format
    const payload = {
      name: role.name,
      display_name: role.display_name,
      description: role.description,
      access: (role.permissions ?? []).map((p) => ({ permission: p })),
    };

    const response = await client.post('/api/rbac/v1/roles/', payload);
    const uuid = response.data?.uuid;
    if (uuid) {
      mapping[role.name] = uuid;
      console.error(`  ✓ Created role "${role.name}" → ${uuid}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Role "${role.name}": ${message}`);
    console.error(`  ✗ Role "${role.name}": ${message}`);
  }
}

/**
 * Create a group via API.
 */
async function createGroup(
  client: AxiosInstance,
  group: GroupInput,
  mapping: ResourceMapping,
  errors: string[],
): Promise<void> {
  try {
    const response = await client.post('/api/rbac/v1/groups/', {
      name: group.name,
      description: group.description,
    });
    const uuid = response.data?.uuid;
    if (uuid) {
      mapping[group.name] = uuid;
      console.error(`  ✓ Created group "${group.name}" → ${uuid}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Group "${group.name}": ${message}`);
    console.error(`  ✗ Group "${group.name}": ${message}`);
  }
}

/**
 * Create a workspace via API.
 */
async function createWorkspace(
  client: AxiosInstance,
  workspace: WorkspaceInput,
  mapping: ResourceMapping,
  errors: string[],
  rootWorkspaceId?: string,
): Promise<void> {
  try {
    const payload = {
      name: workspace.name,
      description: workspace.description,
      parent_id: workspace.parent_id || rootWorkspaceId,
    };

    const response = await client.post('/api/rbac/v2/workspaces/', payload);
    const id = response.data?.id;
    if (id) {
      mapping[workspace.name] = id;
      console.error(`  ✓ Created workspace "${workspace.name}" → ${id}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Workspace "${workspace.name}": ${message}`);
    console.error(`  ✗ Workspace "${workspace.name}": ${message}`);
  }
}

/**
 * Fetch root workspace ID for creating child workspaces.
 */
async function fetchRootWorkspaceId(client: AxiosInstance): Promise<string | undefined> {
  try {
    const response = await client.get('/api/rbac/v2/workspaces/', {
      params: { type: 'root' },
    });
    return response.data?.data?.[0]?.id;
  } catch {
    console.error('  ⚠ Could not fetch root workspace');
    return undefined;
  }
}

// ============================================================================
// Dry Run Mode
// ============================================================================

/**
 * Output curl commands for dry-run mode.
 * Commands go to stdout for piping, progress goes to stderr.
 */
function outputDryRunCurl(
  method: 'GET' | 'POST' | 'DELETE',
  endpoint: string,
  data?: unknown,
  description?: string,
): void {
  const baseUrl = getEnvConfig().apiUrl;
  const url = `${baseUrl}${endpoint}`;

  if (description) {
    console.error(`  → ${description}`);
  }

  let curlCmd = `curl -X ${method} '${url}'`;
  curlCmd += ` \\\n  -H 'Authorization: Bearer $TOKEN'`;
  curlCmd += ` \\\n  -H 'Accept: application/json'`;

  if (data) {
    curlCmd += ` \\\n  -H 'Content-Type: application/json'`;
    curlCmd += ` \\\n  -d '${JSON.stringify(data)}'`;
  }

  // Output to stdout (pipeable)
  console.log(curlCmd);
  console.log('');
}

/**
 * Execute seeding in dry-run mode - outputs curl commands.
 */
function executeSeedDryRun(payload: SeedPayload): SeederResult {
  const result: SeederResult = {
    success: true,
    roles: {},
    groups: {},
    workspaces: {},
    errors: [],
  };

  console.log('#!/bin/bash');
  console.log('# Dry-run seed commands');
  console.log('# Set TOKEN environment variable before running');
  console.log('# Usage: TOKEN="your-jwt-token" bash this-script.sh');
  console.log('');

  // Process roles
  const roles = payload.roles ?? [];
  const systemRoles = roles.filter((r) => isSystemDefaultRole(r.name));
  const customRoles = roles.filter((r) => !isSystemDefaultRole(r.name));

  if (systemRoles.length > 0) {
    console.error(`\n📦 Would lookup ${systemRoles.length} system role(s)...`);
    console.log('# System role lookups');
    for (const role of systemRoles) {
      result.roles[role.name] = '<would-lookup>';
      outputDryRunCurl('GET', `/api/rbac/v1/roles/?name=${encodeURIComponent(role.name)}`, undefined, `Lookup: ${role.name}`);
    }
  }

  if (customRoles.length > 0) {
    console.error(`\n📦 Would create ${customRoles.length} role(s)...`);
    console.log('# Role creations');
    for (const role of customRoles) {
      result.roles[role.name] = '<would-create>';
      // Transform to V1 API format for curl output
      const v1Payload = {
        name: role.name,
        display_name: role.display_name,
        description: role.description,
        access: (role.permissions ?? []).map((p) => ({ permission: p })),
      };
      outputDryRunCurl('POST', '/api/rbac/v1/roles/', v1Payload, `Create: ${role.name}`);
    }
  }

  // Process groups
  const groups = payload.groups ?? [];
  const systemGroups = groups.filter((g) => isSystemDefaultGroup(g.name));
  const customGroups = groups.filter((g) => !isSystemDefaultGroup(g.name));

  if (systemGroups.length > 0) {
    console.error(`\n📦 Would lookup ${systemGroups.length} system group(s)...`);
    console.log('# System group lookups');
    for (const group of systemGroups) {
      result.groups[group.name] = '<would-lookup>';
      outputDryRunCurl('GET', `/api/rbac/v1/groups/?name=${encodeURIComponent(group.name)}`, undefined, `Lookup: ${group.name}`);
    }
  }

  if (customGroups.length > 0) {
    console.error(`\n📦 Would create ${customGroups.length} group(s)...`);
    console.log('# Group creations');
    for (const group of customGroups) {
      result.groups[group.name] = '<would-create>';
      outputDryRunCurl('POST', '/api/rbac/v1/groups/', { name: group.name, description: group.description }, `Create: ${group.name}`);
    }
  }

  // Process workspaces
  const workspaces = payload.workspaces ?? [];
  if (workspaces.length > 0) {
    console.error(`\n📦 Would create ${workspaces.length} workspace(s)...`);
    console.log('# Workspace creations');
    for (const workspace of workspaces) {
      result.workspaces[workspace.name] = '<would-create>';
      outputDryRunCurl(
        'POST',
        '/api/rbac/v2/workspaces/',
        { name: workspace.name, description: workspace.description, parent_id: workspace.parent_id || '<root>' },
        `Create: ${workspace.name}`,
      );
    }
  }

  return result;
}

// ============================================================================
// Main Seeder Logic
// ============================================================================

/**
 * Execute seeding operations.
 */
async function executeSeed(payload: SeedPayload, client: AxiosInstance): Promise<SeederResult> {
  const result: SeederResult = {
    success: true,
    roles: {},
    groups: {},
    workspaces: {},
    errors: [],
  };

  const CONCURRENCY_LIMIT = 5;

  // Process roles - separate system vs custom
  const roles = payload.roles ?? [];
  const systemRoles = roles.filter((r) => isSystemDefaultRole(r.name));
  const customRoles = roles.filter((r) => !isSystemDefaultRole(r.name));

  if (systemRoles.length > 0) {
    console.error(`\n📦 Looking up ${systemRoles.length} system role(s)...`);
    for (const role of systemRoles) {
      await lookupRole(client, role.name, result.roles, result.errors);
    }
  }

  if (customRoles.length > 0) {
    console.error(`\n📦 Creating ${customRoles.length} role(s)...`);
    await withConcurrencyLimit(customRoles, CONCURRENCY_LIMIT, (role) =>
      createRole(client, role, result.roles, result.errors),
    );
  }

  // Process groups - separate system vs custom
  const groups = payload.groups ?? [];
  const systemGroups = groups.filter((g) => isSystemDefaultGroup(g.name));
  const customGroups = groups.filter((g) => !isSystemDefaultGroup(g.name));

  if (systemGroups.length > 0) {
    console.error(`\n📦 Looking up ${systemGroups.length} system group(s)...`);
    for (const group of systemGroups) {
      await lookupGroup(client, group.name, result.groups, result.errors);
    }
  }

  if (customGroups.length > 0) {
    console.error(`\n📦 Creating ${customGroups.length} group(s)...`);
    await withConcurrencyLimit(customGroups, CONCURRENCY_LIMIT, (group) =>
      createGroup(client, group, result.groups, result.errors),
    );
  }

  // Seed workspaces (all are custom - no system defaults)
  const workspaces = payload.workspaces ?? [];
  if (workspaces.length > 0) {
    console.error(`\n📦 Creating ${workspaces.length} workspace(s)...`);
    const rootWorkspaceId = await fetchRootWorkspaceId(client);
    // Workspaces should be created sequentially to handle parent-child relationships
    for (const workspace of workspaces) {
      await createWorkspace(client, workspace, result.workspaces, result.errors, rootWorkspaceId);
    }
  }

  result.success = result.errors.length === 0;
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
    // SAFETY RAIL: Block production (unless dry-run)
    if (!options.dryRun) {
      assertNotProduction();
    }

    const envConfig = getEnvConfig();
    const separator = '__';

    console.error(`\n🌱 RBAC Seeder${options.dryRun ? ' [DRY-RUN MODE]' : ''}`);
    console.error(`━`.repeat(50));
    console.error(`Environment: ${envConfig.name}`);
    console.error(`API URL: ${envConfig.apiUrl}`);
    console.error(`Payload: ${options.file}`);
    if (options.prefix) {
      console.error(`Prefix: "${options.prefix}" (separator: "${separator}")`);
    }
    console.error(`\n📋 System Defaults (will be looked up, not created):`);
    console.error(`   Roles: ${SYSTEM_DEFAULT_ROLES.join(', ')}`);
    console.error(`   Groups: ${SYSTEM_DEFAULT_GROUPS.join(', ')}`);
    console.error(`━`.repeat(50));

    // Read and validate payload
    let payload = await readPayload(options.file);

    // Apply prefix if provided
    if (options.prefix) {
      payload = applyPrefix(payload, options.prefix);
    }

    const totalOps = (payload.roles?.length ?? 0) + (payload.groups?.length ?? 0) + (payload.workspaces?.length ?? 0);

    if (totalOps === 0) {
      console.error('\n⚠ No operations to perform. Payload is empty.');
      return 1;
    }

    // DRY-RUN MODE: Output curl commands and exit
    if (options.dryRun) {
      const result = executeSeedDryRun(payload);

      console.error(`\n${'━'.repeat(50)}`);
      console.error(`📊 Dry-run Summary:`);
      console.error(`  Roles: ${Object.keys(result.roles).length} would be processed`);
      console.error(`  Groups: ${Object.keys(result.groups).length} would be processed`);
      console.error(`  Workspaces: ${Object.keys(result.workspaces).length} would be processed`);
      console.error(`\n✅ Dry-run completed. No changes made.`);

      // Output JSON mapping if requested
      if (options.json) {
        const mapping = {
          roles: result.roles,
          groups: result.groups,
          workspaces: result.workspaces,
        };
        console.log(JSON.stringify(mapping, null, 2));
      }

      return 0;
    }

    // LIVE MODE: Actually create resources
    console.error(`\n🔐 Authenticating...`);

    // Get token and initialize API client
    const token = await getToken();
    initializeApiClient(token);
    const client = getApiClient();

    console.error(`✓ Authenticated`);

    // Execute seeding
    const result = await executeSeed(payload, client);

    // Output summary
    console.error(`\n${'━'.repeat(50)}`);
    console.error(`📊 Summary:`);
    console.error(`  Roles: ${Object.keys(result.roles).length} processed`);
    console.error(`  Groups: ${Object.keys(result.groups).length} processed`);
    console.error(`  Workspaces: ${Object.keys(result.workspaces).length} processed`);

    if (result.errors.length > 0) {
      console.error(`  Errors: ${result.errors.length}`);
    }

    // Output JSON mapping if requested
    if (options.json) {
      const mapping = {
        roles: result.roles,
        groups: result.groups,
        workspaces: result.workspaces,
      };
      console.log(JSON.stringify(mapping, null, 2));
    }

    if (result.success) {
      console.error(`\n✅ Seeding completed successfully!`);
      return 0;
    } else {
      console.error(`\n⚠ Seeding completed with ${result.errors.length} error(s)`);
      return 1;
    }
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
