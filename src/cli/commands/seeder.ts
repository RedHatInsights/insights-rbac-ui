/**
 * Seeder Command Handler
 *
 * Bulk create RBAC resources (roles, groups, workspaces) from JSON payload.
 * Supports prefix for test isolation and outputs name-to-UUID mapping.
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
import { type GroupInput, type RoleInput, type SeedPayload, SeedPayloadSchema, type WorkspaceInput } from '../types.js';
import { getApiClient, initializeApiClient } from '../api-client.js';
import { getToken } from '../auth.js';
import { getEnvConfig } from '../auth-bridge.js';
import { assertNotProduction, assertValidPrefix } from './safety.js';
import { type GroupsApiClient, type RoleIn, type RolesApiClient, createGroupsApi, createRolesApi } from '../queries.js';

// ============================================================================
// Types
// ============================================================================

export interface SeederOptions {
  file: string;
  prefix?: string;
  json?: boolean;
  dryRun?: boolean;
  output?: string; // Output file path for JSON mapping
}

interface ResourceMapping {
  [originalName: string]: string; // originalName -> UUID (created or looked up)
}

interface SeederResult {
  roles: ResourceMapping;
  groups: ResourceMapping;
  workspaces: ResourceMapping;
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
async function fetchSystemRoles(client: AxiosInstance): Promise<SystemRole[]> {
  const allRoles: SystemRole[] = [];
  let offset = 0;
  const limit = 100;

  try {
    // Paginate through all system roles
    while (true) {
      const response = await client.get('/api/rbac/v1/roles/', {
        params: { system: true, limit, offset },
      });

      const roles = response.data?.data ?? [];
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
async function fetchSystemGroups(client: AxiosInstance): Promise<SystemGroup[]> {
  const allGroups: SystemGroup[] = [];
  let offset = 0;
  const limit = 100;

  try {
    // Paginate through all groups and filter for system/default ones
    while (true) {
      const response = await client.get('/api/rbac/v1/groups/', {
        params: { system: true, limit, offset },
      });

      const groups = response.data?.data ?? [];
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
 * All custom resources in the payload get prefixed.
 * Role references in groups are also prefixed to match.
 * Personas are passed through unchanged (they are real usernames).
 */
function applyPrefix(payload: SeedPayload, prefix: string): SeedPayload {
  const separator = '__';

  return {
    // Personas are real usernames - do NOT prefix
    personas: payload.personas,
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
    })),
  };
}

// ============================================================================
// API Operations
// ============================================================================

/**
 * Create a role via the Roles API.
 *
 * Uses the typed RolesApiClient from src/data/api/roles.ts.
 * Transforms the simpler `permissions: string[]` format to the V1 API's
 * `access: [{ permission: string, resourceDefinitions: [] }]` format.
 *
 * If the role already exists (400 error), fetches the existing UUID instead of failing.
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

  try {
    const response = await rolesApi.createRole({ roleIn });
    const uuid = response.data?.uuid;
    if (uuid) {
      mapping[role.name] = uuid;
      console.error(`  ✓ Created role "${role.name}" → ${uuid}`);
    }
  } catch (error: unknown) {
    // Handle "already exists" error gracefully
    const isAlreadyExistsError =
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'status' in error.response &&
      error.response.status === 400 &&
      'data' in error.response &&
      error.response.data &&
      typeof error.response.data === 'object' &&
      'errors' in error.response.data &&
      Array.isArray(error.response.data.errors) &&
      error.response.data.errors.some(
        (err: { detail?: string }) => err.detail && err.detail.toLowerCase().includes('already exists'),
      );

    if (isAlreadyExistsError) {
      // Role already exists - fetch its UUID instead
      console.error(`  ⚠ Role "${role.name}" already exists, fetching existing UUID...`);
      try {
        const listResponse = await rolesApi.listRoles({ name: role.name });
        const existingRole = listResponse.data?.data?.[0];
        if (existingRole?.uuid) {
          mapping[role.name] = existingRole.uuid;
          console.error(`  ✓ Using existing role "${role.name}" → ${existingRole.uuid}`);
          return;
        }
      } catch (fetchError) {
        console.error(`  ⚠ Could not fetch existing role: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
    }

    // Re-throw if not handled
    throw error;
  }
}

/**
 * Create a group via the Groups API and optionally attach roles and members.
 *
 * Uses the typed GroupsApiClient from src/data/api/groups.ts.
 * If roles_list is provided, resolves role names to UUIDs and attaches them.
 * If personas are provided, adds all persona usernames as members.
 *
 * If the group already exists (400 error), fetches the existing UUID instead of failing.
 *
 * @throws Error if creation fails (caller should handle)
 */
async function createGroup(
  groupsApi: GroupsApiClient,
  group: GroupInput,
  mapping: ResourceMapping,
  roleMapping: ResourceMapping,
  personas?: Record<string, { username: string }>,
): Promise<void> {
  const groupData = {
    name: group.name,
    description: group.description,
  };

  // Always log curl for debugging
  logCurl('POST', '/api/rbac/v1/groups/', groupData, `Create group: ${group.name}`);

  let uuid: string | undefined;
  let isExisting = false;

  try {
    const response = await groupsApi.createGroup({ group: groupData });
    uuid = response.data?.uuid;
    if (uuid) {
      mapping[group.name] = uuid;
      console.error(`  ✓ Created group "${group.name}" → ${uuid}`);
    }
  } catch (error: unknown) {
    // Handle "already exists" error gracefully
    const isAlreadyExistsError =
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'status' in error.response &&
      error.response.status === 400 &&
      'data' in error.response &&
      error.response.data &&
      typeof error.response.data === 'object' &&
      'errors' in error.response.data &&
      Array.isArray(error.response.data.errors) &&
      error.response.data.errors.some(
        (err: { detail?: string }) => err.detail && err.detail.toLowerCase().includes('already exists'),
      );

    if (isAlreadyExistsError) {
      // Group already exists - fetch its UUID instead
      console.error(`  ⚠ Group "${group.name}" already exists, fetching existing UUID...`);
      try {
        const listResponse = await groupsApi.listGroups({ name: group.name });
        const existingGroup = listResponse.data?.data?.[0];
        if (existingGroup?.uuid) {
          uuid = existingGroup.uuid;
          isExisting = true;
          mapping[group.name] = uuid;
          console.error(`  ✓ Using existing group "${group.name}" → ${uuid}`);
        }
      } catch (fetchError) {
        console.error(`  ⚠ Could not fetch existing group: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }

      if (!uuid) {
        // Re-throw if we couldn't fetch the existing group
        throw error;
      }
    } else {
      // Re-throw if not an "already exists" error
      throw error;
    }
  }

  if (uuid) {
    // Attach roles if specified
    if (group.roles_list && group.roles_list.length > 0) {
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
        try {
          await groupsApi.addRoleToGroup({ uuid, groupRoleIn: { roles: roleUuids } });
          console.error(`    ✓ Attached ${roleUuids.length} role(s) to group`);
        } catch (error) {
          // Don't fail if roles are already attached
          if (isExisting) {
            console.error(`    ⚠ Could not attach roles (may already be attached): ${error instanceof Error ? error.message : 'Unknown error'}`);
          } else {
            throw error;
          }
        }
      }
    }

    // Add all personas as members to enable testing group membership
    if (personas && Object.keys(personas).length > 0) {
      const usernames = Object.values(personas).map((p) => p.username);
      const principalData = { principals: usernames.map((username) => ({ username })) };
      logCurl('POST', `/api/rbac/v1/groups/${uuid}/principals/`, principalData, `Add ${usernames.length} persona(s) to group`);
      try {
        await groupsApi.addPrincipalToGroup({
          uuid,
          groupPrincipalIn: principalData as Parameters<typeof groupsApi.addPrincipalToGroup>[0]['groupPrincipalIn'],
        });
        console.error(`    ✓ Added ${usernames.length} persona(s) to group: ${usernames.join(', ')}`);
      } catch (error) {
        // Don't fail if users are already in group or other non-critical error
        console.error(`    ⚠ Could not add personas to group: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
}

/**
 * Create a workspace via API.
 *
 * If the workspace already exists (400 error), fetches the existing ID instead of failing.
 *
 * @throws Error if creation fails (caller should handle)
 */
async function createWorkspace(client: AxiosInstance, workspace: WorkspaceInput, mapping: ResourceMapping, rootWorkspaceId?: string): Promise<void> {
  const payload = {
    name: workspace.name,
    description: workspace.description,
    parent_id: workspace.parent_id || rootWorkspaceId,
  };

  // Always log curl for debugging
  logCurl('POST', '/api/rbac/v2/workspaces/', payload, `Create workspace: ${workspace.name}`);

  try {
    const response = await client.post('/api/rbac/v2/workspaces/', payload);
    const id = response.data?.id;
    if (id) {
      mapping[workspace.name] = id;
      console.error(`  ✓ Created workspace "${workspace.name}" → ${id}`);
    }
  } catch (error: unknown) {
    // Handle "already exists" error gracefully
    const isAlreadyExistsError =
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'status' in error.response &&
      error.response.status === 400 &&
      'data' in error.response &&
      error.response.data &&
      typeof error.response.data === 'object' &&
      'errors' in error.response.data &&
      Array.isArray(error.response.data.errors) &&
      error.response.data.errors.some(
        (err: { detail?: string }) => err.detail && err.detail.toLowerCase().includes('already exists'),
      );

    if (isAlreadyExistsError) {
      // Workspace already exists - fetch its ID instead
      console.error(`  ⚠ Workspace "${workspace.name}" already exists, fetching existing ID...`);
      try {
        const listResponse = await client.get('/api/rbac/v2/workspaces/', {
          params: { name: workspace.name },
        });
        const existingWorkspace = listResponse.data?.data?.[0];
        if (existingWorkspace?.id) {
          mapping[workspace.name] = existingWorkspace.id;
          console.error(`  ✓ Using existing workspace "${workspace.name}" → ${existingWorkspace.id}`);
          return;
        }
      } catch (fetchError) {
        console.error(`  ⚠ Could not fetch existing workspace: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }
    }

    // Re-throw if not handled
    throw error;
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

/**
 * Fetch Default workspace ID for creating child workspaces.
 * The Default workspace is a better place for test workspaces than root.
 */
async function fetchDefaultWorkspaceId(client: AxiosInstance): Promise<string | undefined> {
  try {
    const response = await client.get('/api/rbac/v2/workspaces/', {
      params: { type: 'default' },
    });
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
function logCurl(method: 'GET' | 'POST' | 'DELETE', endpoint: string, data?: unknown, description?: string): void {
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
}

/**
 * Execute seeding operations:
 *
 * Phase 1: Discover - Fetch all system roles/groups from the API (ALWAYS runs)
 * Phase 2: Create - Create custom resources from the payload (skipped in dry-run)
 *
 * System resources are automatically included in the seed-map for reference.
 * In dry-run mode, discovery still happens but mutations are skipped and curl commands are output.
 */
async function executeSeed(payload: SeedPayload, client: AxiosInstance, options: ExecuteSeedOptions = {}): Promise<SeederResult> {
  const { dryRun = false } = options;

  const result: SeederResult = {
    roles: {},
    groups: {},
    workspaces: {},
  };

  // ============================================================================
  // PHASE 1: DISCOVER - Fetch all system roles and groups (ALWAYS runs)
  // ============================================================================
  console.error(`\n${'━'.repeat(50)}`);
  console.error(`🔍 PHASE 1: Discovering system resources`);
  console.error(`${'━'.repeat(50)}`);

  // Fetch all system roles
  console.error(`\n🔍 Fetching system roles...`);
  const systemRoles = await fetchSystemRoles(client);
  for (const role of systemRoles) {
    result.roles[role.name] = role.uuid;
  }
  console.error(`  ✓ Found ${systemRoles.length} system role(s)`);

  // Fetch all system/default groups
  console.error(`\n🔍 Fetching system groups...`);
  const systemGroups = await fetchSystemGroups(client);
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
  const customResourceCount = customRoles.length + customGroups.length + workspaces.length;

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
      console.error(`📦 Would create ${customRoles.length} role(s)...`);
      for (const role of customRoles) {
        result.roles[role.name] = '<dry-run>';
        const payload = {
          name: role.name,
          display_name: role.display_name,
          description: role.description,
          access: (role.permissions ?? []).map((p) => ({ permission: p, resourceDefinitions: [] })),
        };
        logCurl('POST', '/api/rbac/v1/roles/', payload, `Create role: ${role.name}`);
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

    return result;
  }

  // LIVE MODE: Actually create resources using typed API clients
  // Create API clients from the axios instance
  const rolesApi = createRolesApi(client);
  const groupsApi = createGroupsApi(client);

  // Create custom roles (sequentially, bail on first error)
  if (customRoles.length > 0) {
    console.error(`\n📦 Creating ${customRoles.length} role(s)...`);
    for (const role of customRoles) {
      await createRole(rolesApi, role, result.roles);
    }
  }

  // Create custom groups (sequentially, bail on first error)
  // Pass roleMapping so groups can reference roles by name
  // Pass personas so all test users get added to each group
  if (customGroups.length > 0) {
    console.error(`\n📦 Creating ${customGroups.length} group(s)...`);
    for (const group of customGroups) {
      await createGroup(groupsApi, group, result.groups, result.roles, payload.personas);
    }
  }

  // Create workspaces (sequentially, bail on first error)
  // Note: Workspaces use V2 API, no typed client available yet
  // Create under Default workspace (not root) for better organization
  if (workspaces.length > 0) {
    console.error(`\n📦 Creating ${workspaces.length} workspace(s)...`);
    // Try Default workspace first, fall back to root
    let parentWorkspaceId = await fetchDefaultWorkspaceId(client);
    if (!parentWorkspaceId) {
      console.error('  ⚠ Default workspace not found, falling back to root');
      parentWorkspaceId = await fetchRootWorkspaceId(client);
    } else {
      console.error(`  → Using Default workspace as parent: ${parentWorkspaceId}`);
    }
    for (const workspace of workspaces) {
      await createWorkspace(client, workspace, result.workspaces, parentWorkspaceId);
    }
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

    console.error(`\n🌱 RBAC Seeder${options.dryRun ? ' [DRY-RUN MODE]' : ''}`);
    console.error(`━`.repeat(50));
    console.error(`Environment: ${envConfig.name}`);
    console.error(`API URL: ${envConfig.apiUrl}`);
    console.error(`Payload: ${options.file}`);
    console.error(`Prefix: "${prefix}" (separator: "${separator}")`);
    console.error(`\n📋 System roles/groups will be auto-discovered and included in seed-map.`);
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
    const result = await executeSeed(payload, client, { dryRun: options.dryRun });

    // Output summary
    console.error(`\n${'━'.repeat(50)}`);
    console.error(`📊 Summary${options.dryRun ? ' (dry-run)' : ''}:`);
    console.error(`  Roles: ${Object.keys(result.roles).length} ${options.dryRun ? 'discovered/would-create' : 'processed'}`);
    console.error(`  Groups: ${Object.keys(result.groups).length} ${options.dryRun ? 'discovered/would-create' : 'processed'}`);
    console.error(`  Workspaces: ${Object.keys(result.workspaces).length} ${options.dryRun ? 'discovered/would-create' : 'processed'}`);

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
