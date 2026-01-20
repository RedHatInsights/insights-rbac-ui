/**
 * MSW Handlers for Access Management user journeys
 * Provides realistic API responses based on mock data
 */

import { HttpResponse, delay, http } from 'msw';

// =============================================================================
// REQUEST BODY TYPE DEFINITIONS
// =============================================================================

/** Request body for creating a group */
interface CreateGroupRequest {
  name: string;
  description?: string;
}

/** Request body for updating a group */
interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

/** Request body for adding members (principals) to a group */
interface AddPrincipalsRequest {
  principals: Array<{ username: string }>;
}

/** Request body for adding service accounts to a group */
interface AddServiceAccountsRequest {
  service_accounts: Array<{ clientId: string }>;
}

/** Request body for removing service accounts from a group */
interface RemoveServiceAccountsRequest {
  service_accounts: Array<{ clientId: string }>;
}

/** Request body for creating a role */
interface CreateRoleRequest {
  name: string;
  description?: string;
}

/** Request body for updating a role */
interface UpdateRoleRequest {
  name?: string;
  description?: string;
}
import {
  getRoleBindingsForGroup,
  getRoleBindingsForUser,
  groupMembers,
  mockGroups,
  mockRolesV1,
  mockRolesV2,
  mockServiceAccounts,
  mockUsers,
  rolePermissions,
  roleUserGroups,
  userGroupsMembership,
} from './mockData';

// Simulated network delay for realistic testing
const NETWORK_DELAY = 200;

// =============================================================================
// TEST HELPERS
// =============================================================================

export const testHandlers = [
  // Reset state handler for test isolation
  http.post('/api/test/reset-state', () => {
    return HttpResponse.json({ success: true });
  }),
];

// =============================================================================
// V1 API HANDLERS (Currently Available)
// =============================================================================

export const v1Handlers = [
  // GET /api/rbac/v1/principals/ - List users
  http.get('/api/rbac/v1/principals/', async ({ request }) => {
    await delay(NETWORK_DELAY);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const usernameFilter = url.searchParams.get('usernames');
    const statusFilter = url.searchParams.get('status');

    let filteredUsers = [...mockUsers];

    // Filter by username
    if (usernameFilter) {
      filteredUsers = filteredUsers.filter((u) => u.username.toLowerCase().includes(usernameFilter.toLowerCase()));
    }

    // Filter by status
    if (statusFilter === 'enabled') {
      filteredUsers = filteredUsers.filter((u) => u.is_active);
    } else if (statusFilter === 'disabled') {
      filteredUsers = filteredUsers.filter((u) => !u.is_active);
    }

    // Add user groups count to each user
    const usersWithGroupCount = filteredUsers.map((user) => ({
      ...user,
      user_groups_count: userGroupsMembership[user.username]?.length || 0,
    }));

    const paginatedUsers = usersWithGroupCount.slice(offset, offset + limit);

    return HttpResponse.json({
      data: paginatedUsers,
      meta: {
        count: filteredUsers.length,
        limit,
        offset,
      },
    });
  }),

  // GET /api/rbac/v1/groups/ - List groups
  http.get('/api/rbac/v1/groups/', async ({ request }) => {
    await delay(NETWORK_DELAY);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const nameFilter = url.searchParams.get('name');
    const username = url.searchParams.get('username');
    const systemFilter = url.searchParams.get('system');

    let filteredGroups = [...mockGroups];

    // Filter by name
    if (nameFilter) {
      filteredGroups = filteredGroups.filter((g) => g.name.toLowerCase().includes(nameFilter.toLowerCase()));
    }

    // Filter by username (groups user belongs to)
    if (username) {
      const userGroups = userGroupsMembership[username] || [];
      filteredGroups = filteredGroups.filter((g) => userGroups.includes(g.uuid));
    }

    // Filter by system
    if (systemFilter === 'true') {
      filteredGroups = filteredGroups.filter((g) => g.system);
    } else if (systemFilter === 'false') {
      filteredGroups = filteredGroups.filter((g) => !g.system);
    }

    const paginatedGroups = filteredGroups.slice(offset, offset + limit);

    return HttpResponse.json({
      data: paginatedGroups,
      meta: {
        count: filteredGroups.length,
        limit,
        offset,
      },
    });
  }),

  // GET /api/rbac/v1/groups/:uuid/ - Get single group
  http.get('/api/rbac/v1/groups/:uuid/', async ({ params }) => {
    await delay(NETWORK_DELAY);
    const group = mockGroups.find((g) => g.uuid === params.uuid);
    if (!group) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(group);
  }),

  // POST /api/rbac/v1/groups/ - Create group
  http.post('/api/rbac/v1/groups/', async ({ request }) => {
    await delay(NETWORK_DELAY);
    const body = (await request.json()) as CreateGroupRequest;
    const newGroup = {
      uuid: `group-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      principalCount: 0,
      roleCount: 0,
      serviceAccountCount: 0,
      workspaceCount: 0,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      platform_default: false,
      admin_default: false,
      system: false,
    };
    return HttpResponse.json(newGroup, { status: 201 });
  }),

  // PUT /api/rbac/v1/groups/:uuid/ - Update group
  http.put('/api/rbac/v1/groups/:uuid/', async ({ params, request }) => {
    await delay(NETWORK_DELAY);
    const body = (await request.json()) as UpdateGroupRequest;
    const group = mockGroups.find((g) => g.uuid === params.uuid);
    if (!group) {
      return new HttpResponse(null, { status: 404 });
    }
    const updatedGroup = {
      ...group,
      name: body.name ?? group.name,
      description: body.description ?? group.description,
      modified: new Date().toISOString(),
    };
    return HttpResponse.json(updatedGroup);
  }),

  // DELETE /api/rbac/v1/groups/:uuid/ - Delete group
  http.delete('/api/rbac/v1/groups/:uuid/', async ({ params }) => {
    await delay(NETWORK_DELAY);
    const group = mockGroups.find((g) => g.uuid === params.uuid);
    if (!group) {
      return new HttpResponse(null, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/rbac/v1/groups/:uuid/principals/ - Get group members or service accounts
  http.get('/api/rbac/v1/groups/:uuid/principals/', async ({ params, request }) => {
    await delay(NETWORK_DELAY);
    const url = new URL(request.url);
    const principalType = url.searchParams.get('principal_type');

    if (principalType === 'service-account') {
      // Return mock service accounts for this group
      // In real API, each group would have specific service accounts assigned
      const serviceAccounts = mockServiceAccounts.slice(0, 3); // Return first 3 service accounts
      return HttpResponse.json({
        data: serviceAccounts,
        meta: { count: serviceAccounts.length },
      });
    }

    // Return user members
    const members = groupMembers[params.uuid as string] || [];
    return HttpResponse.json({
      data: members,
      meta: { count: members.length },
    });
  }),

  // POST /api/rbac/v1/groups/:uuid/principals/ - Add members to group
  http.post('/api/rbac/v1/groups/:uuid/principals/', async ({ params, request }) => {
    await delay(NETWORK_DELAY);
    const body = (await request.json()) as AddPrincipalsRequest;
    console.log(`SB: Adding ${body.principals.length} members to group ${params.uuid}`);
    return HttpResponse.json({
      data: body.principals,
      meta: { count: body.principals.length },
    });
  }),

  // POST /api/rbac/v2/groups/:uuid/service-accounts/ - Add service accounts to group
  // GAP: Using guessed V2 API (gap:guessed-v2-api)
  http.post('/api/rbac/v2/groups/:uuid/service-accounts/', async ({ params, request }) => {
    await delay(NETWORK_DELAY);
    const body = (await request.json()) as AddServiceAccountsRequest;
    console.log(`SB: Adding ${body.service_accounts.length} service accounts to group ${params.uuid}`);
    return HttpResponse.json({
      data: body.service_accounts,
      meta: { count: body.service_accounts.length },
    });
  }),

  // DELETE /api/rbac/v2/groups/:uuid/service-accounts/ - Remove service accounts from group
  // GAP: Using guessed V2 API (gap:guessed-v2-api)
  http.delete('/api/rbac/v2/groups/:uuid/service-accounts/', async ({ params, request }) => {
    await delay(NETWORK_DELAY);
    const body = (await request.json()) as RemoveServiceAccountsRequest;
    console.log(`SB: Removing ${body.service_accounts.length} service accounts from group ${params.uuid}`);
    return new HttpResponse(null, { status: 204 });
  }),

  // DELETE /api/rbac/v1/groups/:uuid/principals/ - Remove members from group
  http.delete('/api/rbac/v1/groups/:uuid/principals/', async ({ params, request }) => {
    await delay(NETWORK_DELAY);
    const url = new URL(request.url);
    const usernames = url.searchParams.get('usernames')?.split(',') || [];
    console.log(`SB: Removing ${usernames.length} members from group ${params.uuid}`);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/rbac/v1/groups/:uuid/roles/ - Get roles for group
  // NOTE: Enhanced with V2-style workspace data (gap:guessed-v2-api)
  http.get('/api/rbac/v1/groups/:uuid/roles/', async ({ params }) => {
    await delay(NETWORK_DELAY);
    const groupId = params.uuid as string;

    // Get role bindings for this group (V2-style data with workspace info)
    const bindings = getRoleBindingsForGroup(groupId);

    if (bindings.length > 0) {
      // Return roles with workspace information
      const rolesWithWorkspaces = bindings.map((binding) => ({
        uuid: binding.roleId,
        name: binding.roleName,
        display_name: binding.roleName,
        workspace: binding.workspaceName,
        workspaceId: binding.workspaceId,
      }));

      return HttpResponse.json({
        data: rolesWithWorkspaces,
        meta: { count: rolesWithWorkspaces.length },
      });
    }

    // Fallback: Find roles using old mapping (without workspace data)
    const rolesForGroup = Object.entries(roleUserGroups)
      .filter(([, groupIds]) => groupIds.includes(groupId))
      .map(([roleId]) => {
        const role = mockRolesV2.find((r) => r.uuid === roleId);
        return role ? { ...role, display_name: role.name } : null;
      })
      .filter(Boolean);

    // If no specific roles found, return default roles from V1
    const rolesToReturn = rolesForGroup.length > 0 ? rolesForGroup : mockRolesV1.slice(0, 2);

    return HttpResponse.json({
      data: rolesToReturn,
      meta: { count: rolesToReturn.length },
    });
  }),

  // GET /api/rbac/v1/roles/ - List roles (V1)
  http.get('/api/rbac/v1/roles/', async ({ request }) => {
    await delay(NETWORK_DELAY);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const nameFilter = url.searchParams.get('name') || url.searchParams.get('display_name');
    const username = url.searchParams.get('username');

    let filteredRoles = [...mockRolesV1];

    // Filter by name
    if (nameFilter) {
      filteredRoles = filteredRoles.filter((r) => r.name.toLowerCase().includes(nameFilter.toLowerCase()));
    }

    // Filter by username (roles user has) - V2-style with user group and workspace data
    if (username) {
      // Get role bindings for this user (V2-style data with group/workspace info)
      const bindings = getRoleBindingsForUser(username);

      if (bindings.length > 0) {
        // Return roles with user group and workspace information
        const rolesWithBindings = bindings.map((binding) => ({
          uuid: binding.roleId,
          name: binding.roleName,
          display_name: binding.roleName,
          userGroup: binding.groupName,
          userGroupId: binding.groupId,
          workspace: binding.workspaceName,
          workspaceId: binding.workspaceId,
        }));

        const paginatedRoles = rolesWithBindings.slice(offset, offset + limit);
        return HttpResponse.json({
          data: paginatedRoles,
          meta: {
            count: rolesWithBindings.length,
            limit,
            offset,
          },
        });
      }

      // Fallback: return first 2 roles without binding data
      filteredRoles = filteredRoles.slice(0, 2);
    }

    const paginatedRoles = filteredRoles.slice(offset, offset + limit);

    return HttpResponse.json({
      data: paginatedRoles,
      meta: {
        count: filteredRoles.length,
        limit,
        offset,
      },
    });
  }),

  // Cross-account requests (for overview)
  http.get('/api/rbac/v1/cross-account-requests/', async () => {
    await delay(NETWORK_DELAY);
    return HttpResponse.json({
      data: [],
      meta: { count: 0 },
    });
  }),
];

// =============================================================================
// V2 API HANDLERS (GAP - Not Yet Available)
// These handlers simulate the expected V2 API based on design specs
// =============================================================================

export const v2Handlers = [
  // GET /api/rbac/v2/roles/ - List roles (V2)
  http.get('/api/rbac/v2/roles/', async ({ request }) => {
    await delay(NETWORK_DELAY);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const nameFilter = url.searchParams.get('name');
    const systemFilter = url.searchParams.get('system');

    let filteredRoles = [...mockRolesV2];

    // Filter by name
    if (nameFilter) {
      filteredRoles = filteredRoles.filter((r) => r.name.toLowerCase().includes(nameFilter.toLowerCase()));
    }

    // Filter by system
    if (systemFilter === 'true') {
      filteredRoles = filteredRoles.filter((r) => r.system);
    } else if (systemFilter === 'false') {
      filteredRoles = filteredRoles.filter((r) => !r.system);
    }

    const paginatedRoles = filteredRoles.slice(offset, offset + limit);

    return HttpResponse.json({
      data: paginatedRoles,
      meta: {
        count: filteredRoles.length,
        limit,
        offset,
      },
    });
  }),

  // GET /api/rbac/v2/roles/:uuid/ - Get single role (V2)
  http.get('/api/rbac/v2/roles/:uuid/', async ({ params }) => {
    await delay(NETWORK_DELAY);
    const role = mockRolesV2.find((r) => r.uuid === params.uuid);
    if (!role) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      ...role,
      permissions: rolePermissions[role.uuid] || [],
      userGroups: roleUserGroups[role.uuid]?.map((gid) => mockGroups.find((g) => g.uuid === gid)) || [],
    });
  }),

  // POST /api/rbac/v2/roles/ - Create role (V2)
  http.post('/api/rbac/v2/roles/', async ({ request }) => {
    await delay(NETWORK_DELAY);
    const body = (await request.json()) as CreateRoleRequest;
    const newRole = {
      uuid: `role-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      permissions: 0,
      workspaces: 0,
      userGroups: 0,
      modified: new Date().toISOString(),
      system: false,
    };
    return HttpResponse.json(newRole, { status: 201 });
  }),

  // PUT /api/rbac/v2/roles/:uuid/ - Update role (V2)
  http.put('/api/rbac/v2/roles/:uuid/', async ({ params, request }) => {
    await delay(NETWORK_DELAY);
    const body = (await request.json()) as UpdateRoleRequest;
    const role = mockRolesV2.find((r) => r.uuid === params.uuid);
    if (!role) {
      return new HttpResponse(null, { status: 404 });
    }
    const updatedRole = {
      ...role,
      name: body.name ?? role.name,
      description: body.description ?? role.description,
      modified: new Date().toISOString(),
    };
    return HttpResponse.json(updatedRole);
  }),

  // DELETE /api/rbac/v2/roles/:uuid/ - Delete role (V2)
  http.delete('/api/rbac/v2/roles/:uuid/', async ({ params }) => {
    await delay(NETWORK_DELAY);
    const role = mockRolesV2.find((r) => r.uuid === params.uuid);
    if (!role) {
      return new HttpResponse(null, { status: 404 });
    }
    if (role.system) {
      return HttpResponse.json({ error: 'Cannot delete system role' }, { status: 400 });
    }
    return new HttpResponse(null, { status: 204 });
  }),
];

// =============================================================================
// USER STATUS HANDLERS (Account Management API)
// =============================================================================

export const userStatusHandlers = [
  // POST /management/account/v1/accounts/:accountId/users/:userId/status - Update user status
  http.post('https://api.access.redhat.com/management/account/v1/accounts/:accountId/users/:userId/status', async () => {
    await delay(NETWORK_DELAY);
    return HttpResponse.json({ success: true });
  }),
];

// =============================================================================
// SERVICE ACCOUNTS HANDLERS (External SSO API - GAP)
// =============================================================================

export const serviceAccountHandlers = [
  // Simulated SSO API for service accounts
  http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', async () => {
    await delay(NETWORK_DELAY);
    return HttpResponse.json(mockServiceAccounts);
  }),

  http.get('https://sso.stage.redhat.com/realms/redhat-external/apis/service_accounts/v1', async () => {
    await delay(NETWORK_DELAY);
    return HttpResponse.json(mockServiceAccounts);
  }),
];

// =============================================================================
// COMBINED HANDLERS
// =============================================================================

export const allHandlers = [...testHandlers, ...v1Handlers, ...v2Handlers, ...serviceAccountHandlers, ...userStatusHandlers];

// Default handlers (V1 only - production ready)
export const defaultHandlers = [...testHandlers, ...v1Handlers, ...serviceAccountHandlers, ...userStatusHandlers];

// All handlers including V2 GAPs
export const handlersWithV2Gaps = [...testHandlers, ...v1Handlers, ...v2Handlers, ...serviceAccountHandlers, ...userStatusHandlers];
