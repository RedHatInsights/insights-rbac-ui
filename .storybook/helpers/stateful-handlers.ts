import { http, HttpResponse } from 'msw';
import { Group, Principal, Role, PaginatedResponse } from '../types/entities';
import { Workspace, RoleBindingBySubject } from '../../src/redux/workspaces/reducer';

export interface AppState {
  groups: Group[];
  users: Principal[];
  roles: Role[];
  workspaces: Workspace[];
  serviceAccounts: Array<{
    id: string;
    name: string;
    clientId: string;
    description: string;
    createdBy: string;
    createdAt: number; // Unix timestamp in seconds
  }>;
  // Track which users belong to which groups
  groupMembers: Map<string, Principal[]>;
  // Track which roles are assigned to which groups
  groupRoles: Map<string, Role[]>;
  // Track workspace-specific role bindings (M3+ feature)
  workspaceRoleBindings: Map<string, RoleBindingBySubject[]>;
}

// Special system groups - these are global and shown to admin users
const mockAdminGroup: Group = {
  uuid: 'admin-default',
  name: 'Default admin access',
  description: 'Default admin group',
  principalCount: 'All org admins', // Special display value for admin default group
  roleCount: 15,
  created: '2023-01-01T00:00:00Z',
  modified: '2024-01-01T00:00:00Z',
  platform_default: false,
  admin_default: true,
};

const mockSystemGroup: Group = {
  uuid: 'system-default',
  name: 'Default access',
  description: 'Default access group',
  principalCount: 'All', // Special display value for platform default group
  roleCount: 8,
  created: '2023-01-01T00:00:00Z',
  modified: '2024-01-01T00:00:00Z',
  platform_default: true,
  admin_default: false,
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

  // Store the ORIGINAL initial state with deep copies
  // This ensures reset always goes back to the true initial state
  const originalInitialState: AppState = {
    groups: initialState.groups ? initialState.groups.map(g => ({ ...g })) : [],
    users: initialState.users ? initialState.users.map(u => ({ ...u })) : [],
    roles: initialState.roles ? initialState.roles.map(r => ({ ...r })) : [],
    workspaces: initialState.workspaces ? initialState.workspaces.map(w => ({ ...w })) : [],
    serviceAccounts: initialState.serviceAccounts ? initialState.serviceAccounts.map(sa => ({ ...sa })) : [],
    groupMembers: deepCopyMap(initialState.groupMembers),
    groupRoles: deepCopyMap(initialState.groupRoles),
    workspaceRoleBindings: deepCopyMap(initialState.workspaceRoleBindings),
  };
  
  let state: AppState = {
    groups: originalInitialState.groups.map(g => ({ ...g })),
    users: originalInitialState.users.map(u => ({ ...u })),
    workspaces: originalInitialState.workspaces.map(w => ({ ...w })),
    roles: originalInitialState.roles.map(r => ({ ...r })),
    serviceAccounts: originalInitialState.serviceAccounts.map(sa => ({ ...sa })),
    groupMembers: deepCopyMap(originalInitialState.groupMembers),
    groupRoles: deepCopyMap(originalInitialState.groupRoles),
    workspaceRoleBindings: deepCopyMap(originalInitialState.workspaceRoleBindings),
  };

  return [
    // RESET endpoint - for test isolation (call this at start of play functions)
    http.post('/api/test/reset-state', () => {
      // Deep copy from original state to ensure clean reset
      state = {
        groups: originalInitialState.groups.map(g => ({ ...g })),
        users: originalInitialState.users.map(u => ({ ...u })),
        roles: originalInitialState.roles.map(r => ({ ...r })),
        workspaces: originalInitialState.workspaces.map(w => ({ ...w })),
        serviceAccounts: originalInitialState.serviceAccounts.map(sa => ({ ...sa })),
        groupMembers: deepCopyMap(originalInitialState.groupMembers),
        groupRoles: deepCopyMap(originalInitialState.groupRoles),
        workspaceRoleBindings: deepCopyMap(originalInitialState.workspaceRoleBindings),
      };
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

      // Handle admin default group query - returns special "Default admin access" group
      if (adminDefault === 'true') {
        return HttpResponse.json({
          data: [mockAdminGroup],
          meta: { count: 1, limit, offset },
        });
      }

      // Handle platform default group query - returns special "Default access" group
      if (platformDefault === 'true') {
        return HttpResponse.json({
          data: [mockSystemGroup],
          meta: { count: 1, limit, offset },
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
      const group = state.groups.find((g) => g.uuid === params.groupId);
      
      if (!group) {
        return new HttpResponse(null, { status: 404 });
      }

      return HttpResponse.json(group);
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
      
      // Get members for this group (or empty array if none)
      const members = state.groupMembers.get(groupId) || [];
      const paginated = members.slice(offset, offset + limit);
      
      return HttpResponse.json({
        data: paginated,
        meta: { count: members.length, limit, offset },
      });
    }),
    
    http.post('/api/rbac/v1/groups/:groupId/principals/', async ({ params, request }) => {
      const groupId = params.groupId as string;
      const body = (await request.json()) as { principals: Array<{ username: string }> };
      
      // Get current members or initialize empty array
      const currentMembers = state.groupMembers.get(groupId) || [];
      
      // Add new members (find them in state.users by username)
      body.principals.forEach(({ username }) => {
        const user = state.users.find(u => u.username === username);
        if (user && !currentMembers.find(m => m.username === username)) {
          currentMembers.push(user);
        }
      });
      
      state.groupMembers.set(groupId, currentMembers);
      return HttpResponse.json({ message: 'Principals added successfully' });
    }),
    
    http.delete('/api/rbac/v1/groups/:groupId/principals/', async ({ params, request }) => {
      const groupId = params.groupId as string;
      const url = new URL(request.url);
      const usernames = url.searchParams.get('usernames')?.split(',') || [];
      
      // Get current members
      const currentMembers = state.groupMembers.get(groupId) || [];
      
      // Remove specified members
      const updatedMembers = currentMembers.filter(m => !usernames.includes(m.username));
      state.groupMembers.set(groupId, updatedMembers);
      
      return new HttpResponse(null, { status: 204 });
    }),

    // Group roles endpoints
    http.get('/api/rbac/v1/groups/:groupId/roles/', ({ request, params }) => {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const exclude = url.searchParams.get('exclude');
      const groupId = params.groupId as string;
      
      // Get roles for this group (or empty array if none)
      const groupRoles = state.groupRoles.get(groupId) || [];
      
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
      
      // Get current roles or initialize empty array
      const currentRoles = state.groupRoles.get(groupId) || [];
      
      // Add new roles (find them in state.roles by uuid)
      body.roles.forEach((roleUuid) => {
        const role = state.roles.find(r => r.uuid === roleUuid);
        if (role && !currentRoles.find(r => r.uuid === roleUuid)) {
          currentRoles.push(role);
        }
      });
      
      state.groupRoles.set(groupId, currentRoles);
      return HttpResponse.json({ message: 'Roles added successfully' });
    }),
    
    http.delete('/api/rbac/v1/groups/:groupId/roles/', async ({ params, request }) => {
      const groupId = params.groupId as string;
      const url = new URL(request.url);
      const roleUuids = url.searchParams.get('roles')?.split(',') || [];
      
      // Get current roles
      const currentRoles = state.groupRoles.get(groupId) || [];
      
      // Remove specified roles
      const updatedRoles = currentRoles.filter(r => !roleUuids.includes(r.uuid));
      state.groupRoles.set(groupId, updatedRoles);
      
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
