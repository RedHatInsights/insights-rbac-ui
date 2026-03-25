/**
 * MSW Handler Sets — V1/V2 Boundary Enforcement
 *
 * These handlers compose factory-based CRUD handlers with journey-specific
 * mock data (group memberships, role bindings, user-group mappings) from
 * mockData.ts that the generic factories don't model.
 *
 * For component stories that need simple CRUD handlers, use the factories
 * directly (groupsHandlers, v1RolesHandlers, etc.)
 *
 * RULES:
 * - V1 stories use `v1DefaultHandlers`. V2 stories use `v2DefaultHandlers`.
 * - Never mix V1 and V2 role handlers in the same story.
 * - Shared APIs (users/principals, groups, permissions) are included in both
 *   because V2 wraps V1 for these until V2 equivalents ship.
 * - If a V2 component accidentally calls /api/rbac/v1/roles/ (or vice versa),
 *   MSW's onUnhandledRequest: 'error' will catch it.
 */

import { HttpResponse, delay, http } from 'msw';

// Factory re-exports for journey stories
export { createGroupsHandlers, groupsHandlers, groupsErrorHandlers, groupsLoadingHandlers } from '../../../shared/data/mocks/groups.handlers';
export { createUsersHandlers, usersHandlers, usersErrorHandlers, usersLoadingHandlers } from '../../../shared/data/mocks/users.handlers';
export {
  createPermissionsHandlers,
  permissionsHandlers,
  permissionsErrorHandlers,
  permissionsLoadingHandlers,
} from '../../../shared/data/mocks/permissions.handlers';
export {
  createServiceAccountsHandlers,
  serviceAccountsHandlers,
  serviceAccountsErrorHandlers,
  serviceAccountsLoadingHandlers,
} from '../../../shared/data/mocks/serviceAccounts.handlers';
export { createV1RolesHandlers, v1RolesHandlers, v1RolesErrorHandlers, v1RolesLoadingHandlers } from '../../../v1/data/mocks/roles.handlers';
export { createV2RolesHandlers, v2RolesHandlers, v2RolesErrorHandlers, v2RolesLoadingHandlers } from '../../../v2/data/mocks/roles.handlers';
export { groupMembersHandlers, groupMembersErrorHandlers, groupMembersLoadingHandlers } from '../../../shared/data/mocks/groupMembers.handlers';
export { groupRolesHandlers, groupRolesErrorHandlers, groupRolesLoadingHandlers } from '../../../shared/data/mocks/groupRoles.handlers';
export { workspacesHandlers, workspacesErrorHandlers, workspacesLoadingHandlers } from '../../../v2/data/mocks/workspaces.handlers';
export {
  roleBindingsHandlers,
  roleBindingsErrorHandlers,
  roleBindingsLoadingHandlers,
  createRoleBindingsListHandlers,
} from '../../../v2/data/mocks/roleBindings.handlers';
export {
  accountManagementHandlers,
  accountManagementErrorHandlers,
  accountManagementLoadingHandlers,
} from '../../../shared/data/mocks/accountManagement.handlers';
export { accessHandlers, accessErrorHandlers, accessLoadingHandlers } from '../../../v1/data/mocks/access.handlers';
export { inventoryHandlers, inventoryErrorHandlers, inventoryLoadingHandlers } from '../../../v1/data/mocks/inventory.handlers';
export { auditHandlers, auditErrorHandlers, auditLoadingHandlers } from '../../../v2/data/mocks/audit.handlers';

import { usersHandlers } from '../../../shared/data/mocks/users.handlers';
import { groupsHandlers } from '../../../shared/data/mocks/groups.handlers';
import { groupMembersHandlers } from '../../../shared/data/mocks/groupMembers.handlers';
import { groupRolesHandlers } from '../../../shared/data/mocks/groupRoles.handlers';
import { serviceAccountsHandlers } from '../../../shared/data/mocks/serviceAccounts.handlers';
import { accountManagementHandlers } from '../../../shared/data/mocks/accountManagement.handlers';
import { v1RolesHandlers } from '../../../v1/data/mocks/roles.handlers';
import { v2RolesHandlers } from '../../../v2/data/mocks/roles.handlers';
import { auditHandlers } from '../../../v2/data/mocks/audit.handlers';
import { createRoleBindingsListHandlers, roleBindingsHandlers } from '../../../v2/data/mocks/roleBindings.handlers';
import type { RoleBinding } from '../../../v2/data/queries/roleBindings';

import {
  getRoleBindingsForGroup,
  getRoleBindingsForUser,
  groupMembers,
  mockGroups,
  mockRoleBindings,
  mockRolesV2,
  mockServiceAccounts,
  mockUsers,
  rolePermissions,
  roleUserGroups,
  userGroupsMembership,
} from './mockData';

const NETWORK_DELAY = 200;

// =============================================================================
// JOURNEY-SPECIFIC HANDLERS
// These use cross-referenced mock data from mockData.ts that
// the generic factories don't model. They augment factory handlers
// for journey stories that need enriched responses.
// =============================================================================

const journeySpecificGroupMemberHandlers = [
  http.get('/api/rbac/v1/groups/:uuid/principals/', async ({ params, request }) => {
    await delay(NETWORK_DELAY);
    const url = new URL(request.url);
    const principalType = url.searchParams.get('principal_type');

    if (principalType === 'service-account') {
      const serviceAccounts = mockServiceAccounts.slice(0, 3);
      return HttpResponse.json({
        data: serviceAccounts,
        meta: { count: serviceAccounts.length },
      });
    }

    const members = groupMembers[params.uuid as string] || [];
    return HttpResponse.json({
      data: members,
      meta: { count: members.length },
    });
  }),
];

const journeySpecificGroupRolesHandlers = [
  http.get('/api/rbac/v1/groups/:uuid/roles/', async ({ params }) => {
    await delay(NETWORK_DELAY);
    const groupId = params.uuid as string;
    const bindings = getRoleBindingsForGroup(groupId);

    if (bindings.length > 0) {
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

    const rolesForGroup = Object.entries(roleUserGroups)
      .filter(([, groupIds]) => groupIds.includes(groupId))
      .map(([roleId]) => {
        const role = mockRolesV2.find((r) => r.uuid === roleId);
        return role ? { ...role, display_name: role.name } : null;
      })
      .filter(Boolean);

    const rolesToReturn = rolesForGroup.length > 0 ? rolesForGroup : [];

    return HttpResponse.json({
      data: rolesToReturn,
      meta: { count: rolesToReturn.length },
    });
  }),
];

const journeySpecificUsersHandlers = [
  http.get('/api/rbac/v1/principals/', async ({ request }) => {
    await delay(NETWORK_DELAY);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const usernameFilter = url.searchParams.get('usernames');
    const statusFilter = url.searchParams.get('status');
    const { mockUsers } = await import('./mockData');

    let filteredUsers = [...mockUsers];

    if (usernameFilter) {
      filteredUsers = filteredUsers.filter((u) => u.username.toLowerCase().includes(usernameFilter.toLowerCase()));
    }

    if (statusFilter === 'enabled') {
      filteredUsers = filteredUsers.filter((u) => u.is_active);
    } else if (statusFilter === 'disabled') {
      filteredUsers = filteredUsers.filter((u) => !u.is_active);
    }

    const usersWithGroupCount = filteredUsers.map((user) => ({
      ...user,
      user_groups_count: userGroupsMembership[user.username]?.length || 0,
    }));

    const paginatedUsers = usersWithGroupCount.slice(offset, offset + limit);

    return HttpResponse.json({
      data: paginatedUsers,
      meta: { count: filteredUsers.length, limit, offset },
    });
  }),
];

const journeySpecificGroupsHandlers = [
  http.get('/api/rbac/v1/groups/', async ({ request }) => {
    await delay(NETWORK_DELAY);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const nameFilter = url.searchParams.get('name');
    const username = url.searchParams.get('username');
    const systemFilter = url.searchParams.get('system');

    let filteredGroups = [...mockGroups];

    if (nameFilter) {
      filteredGroups = filteredGroups.filter((g) => g.name.toLowerCase().includes(nameFilter.toLowerCase()));
    }

    if (username) {
      const userGroups = userGroupsMembership[username] || [];
      filteredGroups = filteredGroups.filter((g) => userGroups.includes(g.uuid));
    }

    if (systemFilter === 'true') {
      filteredGroups = filteredGroups.filter((g) => g.system);
    } else if (systemFilter === 'false') {
      filteredGroups = filteredGroups.filter((g) => !g.system);
    }

    const paginatedGroups = filteredGroups.slice(offset, offset + limit);

    return HttpResponse.json({
      data: paginatedGroups,
      meta: { count: filteredGroups.length, limit, offset },
    });
  }),
];

const journeyV2RoleHandlers = [
  http.get('/api/rbac/v2/roles/', async ({ request }) => {
    await delay(NETWORK_DELAY);
    const url = new URL(request.url);
    const usernameFilter = url.searchParams.get('username');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    if (usernameFilter) {
      const bindings = getRoleBindingsForUser(usernameFilter);
      const rolesWithBindings = bindings.map((binding) => ({
        id: binding.roleId,
        name: binding.roleName,
        display_name: binding.roleName,
        userGroup: binding.groupName,
        userGroupId: binding.groupId,
        workspace: binding.workspaceName,
        workspaceId: binding.workspaceId,
        permissions_count: 0,
      }));
      return HttpResponse.json({
        data: rolesWithBindings,
        meta: { count: rolesWithBindings.length, limit, offset: 0 },
      });
    }

    return HttpResponse.json({
      data: mockRolesV2.map((r) => ({
        id: r.uuid,
        name: r.name,
        display_name: r.name,
        permissions_count: 0,
      })),
      meta: { count: mockRolesV2.length, limit, offset: 0 },
    });
  }),

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
];

const journeyV1RoleHandlers = [
  http.get('/api/rbac/v1/roles/', async ({ request }) => {
    await delay(NETWORK_DELAY);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const nameFilter = url.searchParams.get('name') || url.searchParams.get('display_name');
    const username = url.searchParams.get('username');
    const { mockRolesV1 } = await import('./mockData');

    let filteredRoles = [...mockRolesV1];

    if (nameFilter) {
      filteredRoles = filteredRoles.filter((r) => r.name.toLowerCase().includes(nameFilter.toLowerCase()));
    }

    if (username) {
      const bindings = getRoleBindingsForUser(username);

      if (bindings.length > 0) {
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
          meta: { count: rolesWithBindings.length, limit, offset },
        });
      }

      filteredRoles = filteredRoles.slice(0, 2);
    }

    const paginatedRoles = filteredRoles.slice(offset, offset + limit);

    return HttpResponse.json({
      data: paginatedRoles,
      meta: { count: filteredRoles.length, limit, offset },
    });
  }),
];

// =============================================================================
// COMBINED HANDLERS — V1/V2 Boundary Enforcement
// =============================================================================

/**
 * Shared API handlers using journey-specific mock data.
 * Journey-specific handlers (with cross-referenced data from mockData.ts) are
 * placed BEFORE factory handlers — MSW uses first-match, so the journey-specific
 * handlers override the factory defaults for the same endpoints.
 */
const sharedApiHandlers = [
  ...journeySpecificUsersHandlers,
  ...journeySpecificGroupsHandlers,
  ...journeySpecificGroupMemberHandlers,
  ...journeySpecificGroupRolesHandlers,
  ...groupsHandlers(),
  ...usersHandlers(),
  ...groupMembersHandlers(),
  ...groupRolesHandlers(),
  ...serviceAccountsHandlers(),
  ...accountManagementHandlers(),
  http.get('*/api/rbac/v1/cross-account-requests/', async () => {
    await delay(NETWORK_DELAY);
    return HttpResponse.json({ data: [], meta: { count: 0 } });
  }),
];

/** V1 stories: V1 roles + shared APIs */
export const v1DefaultHandlers = [...journeyV1RoleHandlers, ...v1RolesHandlers(), ...sharedApiHandlers];

const journeyRoleBindings: RoleBinding[] = mockRoleBindings.map((b) => ({
  role: { id: b.roleId, name: b.roleName },
  subject: { id: b.groupId, type: 'group', groupName: b.groupName },
  resource: { id: b.workspaceId, name: b.workspaceName, type: 'workspace' },
}));

/** Expand group bindings into per-user bindings so subject_type=user queries match. */
const journeyUserRoleBindings: RoleBinding[] = Object.entries(userGroupsMembership).flatMap(([username, groupIds]) =>
  groupIds.flatMap((groupId) =>
    journeyRoleBindings.filter((b) => b.subject.id === groupId).map((b) => ({ ...b, subject: { ...b.subject, id: username, type: 'user' } })),
  ),
);

const allJourneyBindings = [...journeyRoleBindings, ...journeyUserRoleBindings];

/** V2 stories: V2 roles + shared APIs + audit log + role bindings */
export const v2DefaultHandlers = [
  ...journeyV2RoleHandlers,
  ...v2RolesHandlers(),
  ...createRoleBindingsListHandlers(allJourneyBindings),
  ...roleBindingsHandlers(),
  ...auditHandlers(),
  ...sharedApiHandlers,
];

// =============================================================================
// STATEFUL USER STATUS HANDLERS
// For stories that test toggle mutations — the users GET handler returns
// updated data after the IT API POST handler flips `is_active`.
// =============================================================================

interface StatefulUserStatusOptions {
  onToggleStatus?: (...args: unknown[]) => void;
}

/**
 * Returns handlers where the IT API status endpoint mutates a local users
 * snapshot, so the next principals refetch returns the flipped status.
 * Place these BEFORE v2DefaultHandlers — MSW first-match ensures they win.
 */
export function createStatefulUserStatusHandlers({ onToggleStatus }: StatefulUserStatusOptions = {}) {
  const usersSnapshot = mockUsers.map((u) => ({ ...u }));

  return [
    // Users endpoint — serves from mutable snapshot
    http.get('/api/rbac/v1/principals/', async ({ request }) => {
      await delay(NETWORK_DELAY);
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      const usernameFilter = url.searchParams.get('usernames');
      const statusFilter = url.searchParams.get('status');

      let filtered = [...usersSnapshot];
      if (usernameFilter) {
        filtered = filtered.filter((u) => u.username.toLowerCase().includes(usernameFilter.toLowerCase()));
      }
      if (statusFilter === 'enabled') {
        filtered = filtered.filter((u) => u.is_active);
      } else if (statusFilter === 'disabled') {
        filtered = filtered.filter((u) => !u.is_active);
      }

      const withGroups = filtered.map((user) => ({
        ...user,
        user_groups_count: userGroupsMembership[user.username]?.length || 0,
      }));

      return HttpResponse.json({
        data: withGroups.slice(offset, offset + limit),
        meta: { count: filtered.length, limit, offset },
      });
    }),

    // IT API status change — mutates snapshot + calls spy
    http.post('https://api.access.stage.redhat.com/account/v1/accounts/:accountId/users/:userId/status', async ({ params, request }) => {
      await delay(NETWORK_DELAY);
      const body = (await request.json()) as { status: string };

      const user = usersSnapshot.find((u) => String(u.external_source_id) === String(params.userId));
      if (user) {
        user.is_active = body.status === 'enabled';
      }

      onToggleStatus?.(params.accountId, params.userId, body);
      return HttpResponse.json({ success: true });
    }),

    // Prod URL variant
    http.post('https://api.access.redhat.com/account/v1/accounts/:accountId/users/:userId/status', async ({ params, request }) => {
      await delay(NETWORK_DELAY);
      const body = (await request.json()) as { status: string };

      const user = usersSnapshot.find((u) => String(u.external_source_id) === String(params.userId));
      if (user) {
        user.is_active = body.status === 'enabled';
      }

      onToggleStatus?.(params.accountId, params.userId, body);
      return HttpResponse.json({ success: true });
    }),
  ];
}

// =============================================================================
// STATEFUL ORG ADMIN TOGGLE HANDLERS
// For stories that test org admin role mutations — the users GET handler
// returns updated data after the IT API POST/DELETE handler flips `is_org_admin`.
// =============================================================================

interface StatefulOrgAdminOptions {
  onToggleOrgAdmin?: (...args: unknown[]) => void;
}

/**
 * Returns handlers where the IT API roles endpoint mutates a local users
 * snapshot, so the next principals refetch returns the flipped org admin state.
 * Place these BEFORE v2DefaultHandlers — MSW first-match ensures they win.
 */
export function createStatefulOrgAdminHandlers({ onToggleOrgAdmin }: StatefulOrgAdminOptions = {}) {
  const usersSnapshot = mockUsers.map((u) => ({ ...u }));

  const handleOrgAdminToggle = async (method: string, params: Record<string, string | readonly string[]>, request: Request) => {
    await delay(NETWORK_DELAY);
    const body = (await request.json()) as { role: string };

    const user = usersSnapshot.find((u) => String(u.external_source_id) === String(params.userId));
    if (user) {
      user.is_org_admin = method === 'POST';
    }

    onToggleOrgAdmin?.(params.accountId, params.userId, body, method);
    return HttpResponse.json({ success: true });
  };

  return [
    http.get('/api/rbac/v1/principals/', async ({ request }) => {
      await delay(NETWORK_DELAY);
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      const usernameFilter = url.searchParams.get('usernames');

      let filtered = [...usersSnapshot];
      if (usernameFilter) {
        filtered = filtered.filter((u) => u.username.toLowerCase().includes(usernameFilter.toLowerCase()));
      }

      const withGroups = filtered.map((user) => ({
        ...user,
        user_groups_count: userGroupsMembership[user.username]?.length || 0,
      }));

      return HttpResponse.json({
        data: withGroups.slice(offset, offset + limit),
        meta: { count: filtered.length, limit, offset },
      });
    }),

    // Grant org admin (POST)
    ...['https://api.access.stage.redhat.com', 'https://api.access.redhat.com'].flatMap((baseUrl) => [
      http.post(`${baseUrl}/account/v1/accounts/:accountId/users/:userId/roles`, ({ params, request }) =>
        handleOrgAdminToggle('POST', params as Record<string, string | readonly string[]>, request),
      ),
      http.delete(`${baseUrl}/account/v1/accounts/:accountId/users/:userId/roles`, ({ params, request }) =>
        handleOrgAdminToggle('DELETE', params as Record<string, string | readonly string[]>, request),
      ),
    ]),
  ];
}
