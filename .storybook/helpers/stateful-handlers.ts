import { http, HttpResponse } from 'msw';
import { Group, Principal, Role, PaginatedResponse } from '../types/entities';
import { Workspace, RoleBindingBySubject } from '../../src/redux/workspaces/reducer';
import {
  AppState,
  ServiceAccount,
  cloneState,
  updateGroup,
  addRolesToGroup,
  removeRolesFromGroup,
  addMembersToGroup,
  removeMembersFromGroup,
  findGroup,
  getGroupMembers,
  getGroupRoles,
} from './immutable-state';

// Special system groups - these are global and shown to admin users
const mockAdminGroup: Group = {
  uuid: 'admin-default',
  name: 'Default admin access',
  description: 'Default admin group',
  principalCount: 'All org admins', // Special display value for admin default group
  roleCount: 0, // Starts with no roles, allowing all to be added
  created: '2023-01-01T00:00:00Z',
  modified: '2024-01-01T00:00:00Z',
  platform_default: false,
  admin_default: true,
  system: true, // Indicates this is the original, unmodified admin default group
};

const mockSystemGroup: Group = {
  uuid: 'system-default',
  name: 'Default access',
  description: 'Default access group',
  principalCount: 'All', // Special display value for platform default group
  roleCount: 0, // Starts with no roles, allowing all to be added
  created: '2023-01-01T00:00:00Z',
  modified: '2024-01-01T00:00:00Z',
  platform_default: true,
  admin_default: false,
  system: true, // Indicates this is the original, unmodified system group
};

/**
 * Creates stateful MSW handlers that maintain in-memory state.
 * State is isolated per story - each call to this function creates fresh state.
 */
export const createStatefulHandlers = (initialState: Partial<AppState> = {}) => {
  // Helper to deep copy Maps with array values
  const deepCopyMap = <K, V>(map: Map<K, V[]> | undefined): Map<K, V[]> => {
    if (!map) return new Map();
    const newMap = new Map<K, V[]>();
    map.forEach((value, key) => {
      newMap.set(key, [...value]);
    });
    return newMap;
  };

  // Mock roles for default groups
  const defaultSystemRoles: Role[] = [
    { uuid: 'role-viewer-1', name: 'Viewer', display_name: 'Viewer', description: 'Read-only access', system: true, platform_default: false, admin_default: false, created: '2023-01-01T00:00:00Z', modified: '2023-01-01T00:00:00Z', policyCount: 1, accessCount: 5, applications: ['insights'], groups_in: [], groups_in_count: 0 },
    { uuid: 'role-editor-1', name: 'Editor', display_name: 'Editor', description: 'Edit access', system: true, platform_default: false, admin_default: false, created: '2023-01-01T00:00:00Z', modified: '2023-01-01T00:00:00Z', policyCount: 1, accessCount: 10, applications: ['insights'], groups_in: [], groups_in_count: 0 },
  ];

  // Store the ORIGINAL initial state with deep copies
  // This ensures reset always goes back to the true initial state
  const originalInitialState: AppState = {
    groups: [
      // Always include the special system groups, but allow overrides from initialState
      // IMPORTANT: Deep copy all group objects to prevent mutation of original state
      ...(initialState.groups?.map(g => ({ ...g })) || []),
      // Add default system groups ONLY if not already provided in initialState
      ...(initialState.groups?.some(g => g.uuid === 'system-default') ? [] : [{ ...mockSystemGroup }]),
      ...(initialState.groups?.some(g => g.uuid === 'admin-default') ? [] : [{ ...mockAdminGroup }]),
    ],
    users: initialState.users ? initialState.users.map(u => ({ ...u })) : [],
    roles: initialState.roles ? initialState.roles.map(r => ({ ...r })) : [],
    workspaces: initialState.workspaces ? initialState.workspaces.map(w => ({ ...w })) : [],
    serviceAccounts: initialState.serviceAccounts ? initialState.serviceAccounts.map(sa => ({ ...sa })) : [],
    groupMembers: deepCopyMap(initialState.groupMembers),
    groupRoles: deepCopyMap(initialState.groupRoles),
    workspaceRoleBindings: deepCopyMap(initialState.workspaceRoleBindings),
  };
  
  // Initialize default group roles (minimal set for manual testing)
  if (!originalInitialState.groupRoles.has('system-default')) {
    // System default group gets first 2 roles for manual testing visibility
    const sampleRoles = originalInitialState.roles.slice(0, 2);
    originalInitialState.groupRoles.set('system-default', sampleRoles);
  }
  if (!originalInitialState.groupRoles.has('admin-default')) {
    // Admin default group gets next 2 roles for manual testing visibility
    const sampleRoles = originalInitialState.roles.slice(2, 4);
    originalInitialState.groupRoles.set('admin-default', sampleRoles);
  }
  
  // Initialize sample data for groups that have counts but no actual data
  // This makes manual testing more realistic
  // Tests that want empty groups should explicitly pass empty Maps for groupMembers/groupRoles
  originalInitialState.groups.forEach(group => {
    // Skip default groups - they're handled above
    if (group.uuid === 'system-default' || group.uuid === 'admin-default') {
      return;
    }
    
    // Only auto-initialize if NO explicit data was provided
    const hasRolesData = originalInitialState.groupRoles.has(group.uuid);
    const hasMembersData = originalInitialState.groupMembers.has(group.uuid);
    
    // Initialize roles based on roleCount (only if not already set)
    if (!hasRolesData && group.roleCount && typeof group.roleCount === 'number' && group.roleCount > 0) {
      const availableRoles = originalInitialState.roles;
      if (availableRoles.length > 0) {
        const rolesToAdd = availableRoles.slice(0, Math.min(group.roleCount, availableRoles.length));
        originalInitialState.groupRoles.set(group.uuid, rolesToAdd.map(r => ({ ...r })));
      }
    }
    
    // Initialize members based on principalCount (only if not already set)
    if (!hasMembersData && group.principalCount && typeof group.principalCount === 'number' && group.principalCount > 0) {
      const availableUsers = originalInitialState.users;
      if (availableUsers.length > 0) {
        const usersToAdd = availableUsers.slice(0, Math.min(group.principalCount, availableUsers.length));
        originalInitialState.groupMembers.set(group.uuid, usersToAdd.map(u => ({ ...u })));
      }
    }
  });
  
  let state: AppState = cloneState(originalInitialState);

  return [
    // RESET endpoint - for test isolation (call this at start of play functions)
    http.post('/api/test/reset-state', () => {
      // Use cloneState for clean, immutable reset
      state = cloneState(originalInitialState);
      return HttpResponse.json({ message: 'State reset successfully' });
    }),
    
    // Groups endpoints
    http.get('/api/rbac/v1/groups/', ({ request }) => {
      const url = new URL(request.url);
      const name = url.searchParams.get('name');
      const nameMatch = url.searchParams.get('name_match');
      const adminDefault = url.searchParams.get('admin_default');
      const platformDefault = url.searchParams.get('platform_default');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      // Handle admin default group query
      if (adminDefault === 'true') {
        const adminGroup = state.groups.find(g => g.admin_default);
        return HttpResponse.json({
          data: adminGroup ? [adminGroup] : [],
          meta: { count: adminGroup ? 1 : 0, limit, offset },
        });
      }

      // Handle platform default group query
      if (platformDefault === 'true') {
        const platformGroup = state.groups.find(g => g.platform_default);
        return HttpResponse.json({
          data: platformGroup ? [platformGroup] : [],
          meta: { count: platformGroup ? 1 : 0, limit, offset },
        });
      }

      let filtered = [...state.groups];

      // Handle name filtering
      if (name && nameMatch === 'exact') {
        filtered = filtered.filter((g) => g.name === name);
      } else if (name) {
        filtered = filtered.filter((g) => g.name.toLowerCase().includes(name.toLowerCase()));
      }

      const paginated = filtered.slice(offset, offset + limit);

      const response: PaginatedResponse<Group> = {
        data: paginated,
        meta: { count: filtered.length, limit, offset },
      };

      return HttpResponse.json(response);
    }),

    // Get single group by ID
    http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
      const groupId = params.groupId as string;
      
      // Use immutable accessor (returns a clone, never the original)
      const group = findGroup(state, groupId);
      
      if (!group) {
        return new HttpResponse(null, { status: 404 });
      }

      // CRITICAL: Always explicitly set platform_default and admin_default to prevent state pollution
      // If these properties are missing/undefined, Redux will inherit them from previous selectedGroup
      return HttpResponse.json({
        ...group,
        platform_default: group.platform_default ?? false,
        admin_default: group.admin_default ?? false,
        system: group.system ?? false,
      });
    }),

    http.post('/api/rbac/v1/groups/', async ({ request }) => {
      const body = (await request.json()) as Partial<Group>;
      const newGroup: Group = {
        uuid: `group-${Date.now()}-${Math.random()}`,
        name: body.name || '',
        description: body.description || '',
        principalCount: 0,
        roleCount: 0,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      state.groups.push(newGroup);
      return HttpResponse.json(newGroup);
    }),

    http.put('/api/rbac/v1/groups/:groupId/', async ({ params, request }) => {
      const body = (await request.json()) as Partial<Group>;
      const idx = state.groups.findIndex((g) => g.uuid === params.groupId);

      if (idx === -1) {
        return new HttpResponse(null, { status: 404 });
      }

      state.groups[idx] = {
        ...state.groups[idx],
        ...body,
        modified: new Date().toISOString(),
      };

      return HttpResponse.json(state.groups[idx]);
    }),

    http.delete('/api/rbac/v1/groups/:groupId/', ({ params }) => {
      state.groups = state.groups.filter((g) => g.uuid !== params.groupId);
      return new HttpResponse(null, { status: 204 });
    }),

    // Group members/principals endpoints
    http.get('/api/rbac/v1/groups/:groupId/principals/', ({ request, params }) => {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const principalType = url.searchParams.get('principal_type');
      const groupId = params.groupId as string;
      
      // Only handle 'user' principal type or default (service accounts handled separately)
      if (principalType && principalType !== 'user') {
        return HttpResponse.json({
          data: [],
          meta: { count: 0, limit, offset },
        });
      }
      
      // Handle unmodified default groups - return empty, they conceptually include "all users"
      // But if the group has been modified (system: false), return actual members from state
      const group = findGroup(state, groupId);
      const isUnmodifiedDefault = (groupId === 'admin-default' || groupId === 'system-default') && group?.system !== false;
      
      if (isUnmodifiedDefault) {
        // Both default groups return empty when unmodified - shows special card message
        // Admin default: "All org admins are members"
        // Platform default: "All users are members"
        return HttpResponse.json({
          data: [],
          meta: { count: 0, limit, offset },
        });
      }
      
      // Get members for this group (using immutable accessor)
      const members = getGroupMembers(state, groupId);
      const paginated = members.slice(offset, offset + limit);
      
      return HttpResponse.json({
        data: paginated,
        meta: { count: members.length, limit, offset },
      });
    }),
    
    http.post('/api/rbac/v1/groups/:groupId/principals/', async ({ params, request }) => {
      const groupId = params.groupId as string;
      const body = (await request.json()) as { principals: Array<{ username: string }> };
      
      // Check if group exists
      const group = findGroup(state, groupId);
      if (!group) {
        return new HttpResponse(null, { status: 404 });
      }
      
      // Check if this is the system default group being modified for the first time
      const isSystemDefaultUnchanged = group.platform_default && group.system !== false;
      
      // If modifying unchanged default group, modify it in-place (matching real backend behavior)
      if (isSystemDefaultUnchanged) {
        state = updateGroup(state, groupId, {
          name: 'Custom default access',
          description: 'Modified default access group',
          system: false, // Mark as modified
          modified: new Date().toISOString(),
        });
      }
      
      // Add members to the group (immutably)
      const usernames = body.principals.map(p => p.username);
      state = addMembersToGroup(state, groupId, usernames);
      
      return HttpResponse.json({ message: 'Principals added successfully' });
    }),
    
    http.delete('/api/rbac/v1/groups/:groupId/principals/', async ({ params, request }) => {
      const groupId = params.groupId as string;
      const url = new URL(request.url);
      const usernames = url.searchParams.get('usernames')?.split(',') || [];
      
      // Remove members from the group (immutably)
      state = removeMembersFromGroup(state, groupId, usernames);
      
      return new HttpResponse(null, { status: 204 });
    }),

    // Group roles endpoints
    http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request, params }) => {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const exclude = url.searchParams.get('exclude');
      const groupId = params.groupId as string;
      
      // Get roles for this group (using immutable accessor)
      const groupRoles = getGroupRoles(state, groupId);
      
      let result: Role[];
      
      if (exclude === 'true') {
        // Return roles NOT in the group (available to add)
        result = state.roles.filter(role => !groupRoles.find(gr => gr.uuid === role.uuid));
      } else {
        // Return roles IN the group
        result = groupRoles;
      }
      
      const paginated = result.slice(offset, offset + limit);
      
      return HttpResponse.json({
        data: paginated,
        meta: { count: result.length, limit, offset },
      });
    }),
    
    http.post('/api/rbac/v1/groups/:groupId/roles/', async ({ params, request }) => {
      const groupId = params.groupId as string;
      const body = (await request.json()) as { roles: string[] };
      
      // Check if group exists
      const group = findGroup(state, groupId);
      if (!group) {
        return new HttpResponse(null, { status: 404 });
      }
      
      // Check if this is the system default group being modified for the first time
      const isSystemDefaultUnchanged = group.platform_default && group.system !== false;
      
      // If modifying unchanged default group, modify it in-place (matching real backend behavior)
      if (isSystemDefaultUnchanged) {
        state = updateGroup(state, groupId, {
          name: 'Custom default access',
          description: 'Modified default access group',
          system: false, // Mark as modified
          modified: new Date().toISOString(),
        });
      }
      
      // Add roles to the group (immutably)
      state = addRolesToGroup(state, groupId, body.roles);
      
      return HttpResponse.json({ message: 'Roles added successfully' });
    }),
    
    http.delete('/api/rbac/v1/groups/:groupId/roles/', async ({ params, request }) => {
      const groupId = params.groupId as string;
      const url = new URL(request.url);
      const roleUuids = url.searchParams.get('roles')?.split(',') || [];
      
      // Remove roles from the group (immutably)
      state = removeRolesFromGroup(state, groupId, roleUuids);
      
      return new HttpResponse(null, { status: 204 });
    }),

    // Users/Principals endpoints
    http.get('/api/rbac/v1/principals/', ({ request }) => {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const username = url.searchParams.get('usernames');

      let filtered = [...state.users];

      // Handle username filtering
      if (username) {
        filtered = filtered.filter((u) => u.username.toLowerCase().includes(username.toLowerCase()));
      }

      const paginated = filtered.slice(offset, offset + limit);

      const response: PaginatedResponse<Principal> = {
        data: paginated,
        meta: { count: filtered.length, limit, offset },
      };

      return HttpResponse.json(response);
    }),

    // Roles endpoints
    http.get('/api/rbac/v1/roles/', ({ request }) => {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const name = url.searchParams.get('name');
      const display_name = url.searchParams.get('display_name');
      const name_match = url.searchParams.get('name_match');
      const scope = url.searchParams.get('scope');
      const application = url.searchParams.get('application');
      // const username = url.searchParams.get('username');
      // Note: username parameter is used by MyUserAccess to filter user's roles
      // scope=principal also filters by user's roles
      // For Storybook, we return all roles to show data in stories
      // In production, the API would filter by user's actual role assignments

      let filtered = [...state.roles];

      // Handle scope=principal (user's assigned roles)
      // For Storybook mock, we allow all roles through to show data
      // In production, this would filter to only roles assigned to the user
      if (scope === 'principal') {
        // Mock behavior: return all roles for demo purposes
        // Real API would filter by user's actual role assignments
      }

      // Handle application filtering (used by MyUserAccess)
      if (application) {
        const apps = application.split(',').map(a => a.trim());
        // Filter roles that have at least one matching application
        // If role has no applications field, include it (legacy roles)
        filtered = filtered.filter((r) => {
          if (!r.applications || r.applications.length === 0) {
            return true; // Include roles without applications field
          }
          return r.applications.some(roleApp => apps.includes(roleApp));
        });
      }

      // Handle name filtering
      if (name) {
        if (name_match === 'exact') {
          filtered = filtered.filter((r) => r.name.toLowerCase() === name.toLowerCase());
        } else {
          filtered = filtered.filter((r) => r.name.toLowerCase().includes(name.toLowerCase()));
        }
      }

      // Handle display_name filtering (used for validation)
      if (display_name) {
        if (name_match === 'exact') {
          filtered = filtered.filter((r) => r.display_name?.toLowerCase() === display_name.toLowerCase());
        } else {
          filtered = filtered.filter((r) => r.display_name?.toLowerCase().includes(display_name.toLowerCase()));
        }
      }

      const paginated = filtered.slice(offset, offset + limit);

      const response: PaginatedResponse<Role> = {
        data: paginated,
        meta: { count: filtered.length, limit, offset },
      };

      return HttpResponse.json(response);
    }),

    // Create a new role
    http.post('/api/rbac/v1/roles/', async ({ request }) => {
      const body = (await request.json()) as { name: string; display_name?: string; description?: string; access: any[] };
      
      const newRole: Role = {
        uuid: `role-${Date.now()}`,
        name: body.name,
        display_name: body.display_name || body.name,
        description: body.description || '',
        system: false,
        platform_default: false,
        admin_default: false,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        policyCount: 1,
        accessCount: body.access?.length || 0,
        applications: body.access?.map((a) => a.permission.split(':')[0]).filter((v, i, arr) => arr.indexOf(v) === i) || [],
        access: body.access || [],
        groups_in: [],
        groups_in_count: 0,
      };

      state.roles.push(newRole);
      return HttpResponse.json(newRole, { status: 201 });
    }),

    // Get single role by ID
    http.get('/api/rbac/v1/roles/:roleId/', ({ params }) => {
      const role = state.roles.find((r) => r.uuid === params.roleId);
      
      if (!role) {
        return new HttpResponse(null, { status: 404 });
      }

      return HttpResponse.json(role);
    }),

    // Update a role
    http.patch('/api/rbac/v1/roles/:roleId/', async ({ params, request }) => {
      const body = (await request.json()) as Partial<Role>;
      const idx = state.roles.findIndex((r) => r.uuid === params.roleId);

      if (idx === -1) {
        return new HttpResponse(null, { status: 404 });
      }

      state.roles[idx] = {
        ...state.roles[idx],
        ...body,
        modified: new Date().toISOString(),
      };

      return HttpResponse.json(state.roles[idx]);
    }),

    // Delete a role
    http.delete('/api/rbac/v1/roles/:roleId/', ({ params }) => {
      state.roles = state.roles.filter((r) => r.uuid !== params.roleId);
      return new HttpResponse(null, { status: 204 });
    }),

    // Permissions options endpoints (for filters in Add Permissions step)
    http.get('/api/rbac/v1/permissions/options/', ({ request }) => {
      const url = new URL(request.url);
      const field = url.searchParams.get('field');

      // Return mock options based on field type
      if (field === 'application') {
        return HttpResponse.json({
          data: ['insights', 'cost-management', 'inventory', 'approval', 'catalog', 'sources', 'notifications'],
        });
      } else if (field === 'resource_type') {
        return HttpResponse.json({
          data: ['*', 'hosts', 'groups', 'workspace', 'group', 'template'],
        });
      } else if (field === 'verb') {
        return HttpResponse.json({
          data: ['*', 'read', 'write', 'create', 'update', 'delete'],
        });
      }

      return HttpResponse.json({ data: [] });
    }),

    // List permissions endpoint (for the permissions table)
    http.get('/api/rbac/v1/permissions/', ({ request }) => {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const application = url.searchParams.get('application');

      // Return mock permissions - basic set
      // Note: 'resource' and 'operation' fields are what the UI expects (not resource_type/verb)
      // 'uuid' must be unique per permission to avoid duplicate key warnings
      const allPermissions = [
        { uuid: 'insights:*:*', permission: 'insights:*:*', application: 'insights', resource: '*', operation: '*' },
        { uuid: 'cost-management:*:*', permission: 'cost-management:*:*', application: 'cost-management', resource: '*', operation: '*' },
        { uuid: 'inventory:hosts:read', permission: 'inventory:hosts:read', application: 'inventory', resource: 'hosts', operation: 'read' },
        { uuid: 'inventory:hosts:write', permission: 'inventory:hosts:write', application: 'inventory', resource: 'hosts', operation: 'write' },
        { uuid: 'approval:*:*', permission: 'approval:*:*', application: 'approval', resource: '*', operation: '*' },
        { uuid: 'catalog:*:*', permission: 'catalog:*:*', application: 'catalog', resource: '*', operation: '*' },
        { uuid: 'sources:*:*', permission: 'sources:*:*', application: 'sources', resource: '*', operation: '*' },
        { uuid: 'notifications:*:*', permission: 'notifications:*:*', application: 'notifications', resource: '*', operation: '*' },
      ];

      let filtered = allPermissions;
      if (application) {
        filtered = filtered.filter((p) => p.application === application || application === '');
      }

      const paginated = filtered.slice(offset, offset + limit);

      return HttpResponse.json({
        data: paginated,
        meta: { count: filtered.length, limit, offset },
      });
    }),

    // Service accounts endpoints - there are TWO different APIs being used
    // 1. RBAC API format (used in some contexts)
    http.get('/api/rbac/v1/service-accounts/', ({ request }) => {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const paginated = state.serviceAccounts.slice(offset, offset + limit);

      return HttpResponse.json({
        data: paginated,
        meta: { count: state.serviceAccounts.length, limit, offset },
      });
    }),

    // 2. SSO service format (used by the actual service accounts API)
    http.get('*/service_accounts/v1', ({ request }) => {
      const url = new URL(request.url);
      const first = parseInt(url.searchParams.get('first') || '0');
      const max = parseInt(url.searchParams.get('max') || '21');

      // Return array directly (not paginated response), with one extra for "has more" detection
      const result = state.serviceAccounts.slice(first, first + max);
      return HttpResponse.json(result);
    }),

    // Change users status (activate/deactivate users)
    // Note: The 404 for /apps/rbac/env.json is expected for non-ITLess environments
    http.put('/change-users-status', async ({ request }) => {
      const body = (await request.json()) as { users: Array<{ username: string; is_active: boolean }> };
      
      // Update the is_active status for each user in the state
      body.users.forEach(({ username, is_active }) => {
        const user = state.users.find(u => u.username === username);
        if (user) {
          user.is_active = is_active;
        }
      });
      
      return HttpResponse.json({ message: 'Users status updated successfully' }, { status: 200 });
    }),

    // Invite users endpoint
    http.post('/user/invite', async ({ request }) => {
      const body = (await request.json()) as { emails: string[]; isAdmin?: boolean };
      
      // In a real implementation, this would send invitation emails
      // For now, just return success
      return HttpResponse.json(
        { 
          message: `Successfully sent ${body.emails.length} invitation(s)`,
          invited: body.emails,
        }, 
        { status: 200 }
      );
    }),

    // Principal access endpoint - returns what access/permissions a user has across applications
    // This is used by the "My User Access" page
    http.get('/api/rbac/v1/access/', ({ request }) => {
      const url = new URL(request.url);
      const application = url.searchParams.get('application') || '';
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      
      // For non-admin users, return empty or minimal access
      // For admin users, this would return their permissions across applications
      // Since we're mocking, return a simple structure based on RBAC only
      const accessData = [
        {
          permission: 'rbac:group:read',
          application: 'rbac',
          resource_type: 'group',
          verb: 'read',
        },
        {
          permission: 'rbac:role:read',
          application: 'rbac',
          resource_type: 'role',
          verb: 'read',
        },
      ];
      
      return HttpResponse.json({
        data: accessData.slice(offset, offset + limit),
        meta: {
          count: accessData.length,
          limit,
          offset,
        },
      });
    }),

    // Workspace endpoints
    // List workspaces
    http.get('/api/rbac/v2/workspaces/', () => {
      return HttpResponse.json({
        data: state.workspaces,
        meta: { count: state.workspaces.length, limit: 10000, offset: 0 },
      });
    }),

    // Create workspace
    http.post('/api/rbac/v2/workspaces/', async ({ request }) => {
      const body = (await request.json()) as { name: string; description?: string; parent_id?: string };
      const newWorkspace: Workspace = {
        id: `ws-${Date.now()}`,
        name: body.name,
        description: body.description || '',
        parent_id: body.parent_id || '',
        type: 'standard',
      };
      state.workspaces.push(newWorkspace);
      return HttpResponse.json(newWorkspace, { status: 201 });
    }),

    // Get workspace by ID
    http.get('/api/rbac/v2/workspaces/:id', ({ params }) => {
      const workspace = state.workspaces.find((w) => w.id === params.id);
      if (!workspace) {
        return HttpResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }
      return HttpResponse.json(workspace);
    }),

    // Update workspace
    http.patch('/api/rbac/v2/workspaces/:id', async ({ params, request }) => {
      const body = (await request.json()) as Partial<Workspace>;
      const workspaceIndex = state.workspaces.findIndex((w) => w.id === params.id);
      if (workspaceIndex === -1) {
        return HttpResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }
      state.workspaces[workspaceIndex] = { ...state.workspaces[workspaceIndex], ...body };
      return HttpResponse.json(state.workspaces[workspaceIndex]);
    }),

    // Delete workspace
    http.delete('/api/rbac/v2/workspaces/:id', ({ params }) => {
      const workspaceIndex = state.workspaces.findIndex((w) => w.id === params.id);
      if (workspaceIndex === -1) {
        return HttpResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }
      state.workspaces.splice(workspaceIndex, 1);
      return HttpResponse.json(null, { status: 204 });
    }),

    // Move workspace (change parent)
    http.post('/api/rbac/v2/workspaces/:id/move', async ({ params, request }) => {
      const body = (await request.json()) as { parent_id: string };
      const workspaceIndex = state.workspaces.findIndex((w) => w.id === params.id);
      if (workspaceIndex === -1) {
        return HttpResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }
      state.workspaces[workspaceIndex].parent_id = body.parent_id;
      return HttpResponse.json(state.workspaces[workspaceIndex]);
    }),

    // Workspace role bindings (M3+ feature)
    // This endpoint returns role bindings for a specific workspace
    http.get('/api/rbac/v2/role-bindings/by-subject', ({ request }) => {
      const url = new URL(request.url);
      const resourceId = url.searchParams.get('resource_id') || url.searchParams.get('resourceId');
      const limit = parseInt(url.searchParams.get('limit') || '10000');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      
      if (!resourceId) {
        // No resource_id specified, return empty
        return HttpResponse.json({
          data: [],
          meta: { count: 0, limit, offset },
        });
      }
      
      // Get role bindings for this specific workspace
      const bindings = state.workspaceRoleBindings.get(resourceId) || [];
      
      // Apply pagination
      const paginatedBindings = bindings.slice(offset, offset + limit);
      
      return HttpResponse.json({
        data: paginatedBindings,
        meta: {
          count: bindings.length,
          limit,
          offset,
        },
      });
    }),
  ];
};
