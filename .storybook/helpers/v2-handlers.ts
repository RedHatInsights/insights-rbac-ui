/**
 * MSW Handlers for V2 APIs (Temporary)
 *
 * These handlers mock the V2 APIs that are still in development.
 * Use them in stories tagged with 'api-v2-mock' for testing.
 *
 * @see Meeting notes: "RBAC v2 specs review with team by Sneha"
 * @tag api-v2-mock
 */

import { HttpResponse, http } from 'msw';
import type { RoleV2 } from '../../src/data/api/rolesV2';

// =============================================================================
// Mock Data
// =============================================================================

const mockRolesV2: RoleV2[] = [
  {
    uuid: 'role-tenant-admin',
    name: 'Tenant admin',
    description: 'Full tenant administrative access',
    permissions: 5,
    modified: '2023-01-01T00:00:00Z',
    system: true,
  },
  {
    uuid: 'role-workspace-admin',
    name: 'Workspace admin',
    description: 'Workspace administrative access',
    permissions: 4,
    modified: '2023-01-01T00:00:00Z',
    system: true,
  },
  {
    uuid: 'role-rhel-devops',
    name: 'RHEL DevOps',
    description: 'RHEL DevOps access',
    permissions: 3,
    modified: '2024-01-01T00:00:00Z',
    system: false,
    access: [
      { application: 'rhel', resourceType: 'systems', operation: 'read' },
      { application: 'rhel', resourceType: 'systems', operation: 'write' },
      { application: 'rhel', resourceType: 'config', operation: 'read' },
    ],
  },
  {
    uuid: 'role-cost-mgmt',
    name: 'Cost mgmt role',
    description: 'Cost management access',
    permissions: null, // "Not available" per design
    modified: '2023-06-01T00:00:00Z',
    system: true,
  },
  {
    uuid: 'role-rhel-inventory',
    name: 'RHEL Inventory viewer',
    description: 'Read-only access to RHEL inventory',
    permissions: 1,
    modified: '2024-01-13T00:00:00Z',
    system: false,
    access: [{ application: 'inventory', resourceType: 'hosts', operation: 'read' }],
  },
];

// Role assignments for drawer view
const mockRoleAssignments: Record<string, Array<{ userGroup: string; workspace: string }>> = {
  'role-rhel-devops': [
    { userGroup: 'Developers', workspace: 'Development' },
    { userGroup: 'DevOps Team', workspace: 'Production' },
  ],
  'role-rhel-inventory': [{ userGroup: 'Viewers', workspace: 'All' }],
};

// =============================================================================
// V2 Roles Handlers
// =============================================================================

export const rolesV2Handlers = [
  // List roles V2
  http.get('/api/rbac/v2/roles/', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const name = url.searchParams.get('name');
    const orderBy = url.searchParams.get('orderBy') || 'name';

    let filtered = [...mockRolesV2];

    // Filter by name
    if (name) {
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(name.toLowerCase()));
    }

    // Sort
    filtered.sort((a, b) => {
      const desc = orderBy.startsWith('-');
      const field = desc ? orderBy.slice(1) : orderBy;
      const aVal = a[field as keyof RoleV2];
      const bVal = b[field as keyof RoleV2];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = String(aVal).localeCompare(String(bVal));
      return desc ? -comparison : comparison;
    });

    // Paginate
    const paginated = filtered.slice(offset, offset + limit);

    return HttpResponse.json({
      data: paginated,
      meta: {
        count: filtered.length,
        limit,
        offset,
      },
    });
  }),

  // Get single role V2
  http.get('/api/rbac/v2/roles/:uuid/', ({ params }) => {
    const role = mockRolesV2.find((r) => r.uuid === params.uuid);
    if (!role) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(role);
  }),

  // Create role V2 - returns created role per Riccardo's request
  http.post('/api/rbac/v2/roles/', async ({ request }) => {
    const body = (await request.json()) as { name: string; description?: string; permissions: string[] };
    const newRole: RoleV2 = {
      uuid: `role-${Date.now()}`,
      name: body.name,
      description: body.description,
      permissions: body.permissions.length,
      modified: new Date().toISOString(),
      system: false,
      access: body.permissions.map((p) => {
        const [app, type, op] = p.split(':');
        return { application: app, resourceType: type, operation: op };
      }),
    };
    mockRolesV2.push(newRole);
    return HttpResponse.json(newRole, { status: 201 });
  }),

  // Update role V2 - returns updated role per Riccardo's request
  http.put('/api/rbac/v2/roles/:uuid/', async ({ params, request }) => {
    const body = (await request.json()) as { name: string; description?: string; permissions: string[] };
    const index = mockRolesV2.findIndex((r) => r.uuid === params.uuid);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    const updatedRole: RoleV2 = {
      ...mockRolesV2[index],
      name: body.name,
      description: body.description,
      permissions: body.permissions.length,
      modified: new Date().toISOString(),
      access: body.permissions.map((p) => {
        const [app, type, op] = p.split(':');
        return { application: app, resourceType: type, operation: op };
      }),
    };
    mockRolesV2[index] = updatedRole;
    return HttpResponse.json(updatedRole);
  }),

  // Delete role V2 (supports bulk)
  http.delete('/api/rbac/v2/roles/:uuid/', ({ params }) => {
    const index = mockRolesV2.findIndex((r) => r.uuid === params.uuid);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    mockRolesV2.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Get role assignments (for drawer)
  http.get('/api/rbac/v2/role-bindings/', ({ request }) => {
    const url = new URL(request.url);
    const roleId = url.searchParams.get('role_id');

    if (!roleId || !mockRoleAssignments[roleId]) {
      return HttpResponse.json({ data: [], meta: { count: 0 } });
    }

    return HttpResponse.json({
      data: mockRoleAssignments[roleId],
      meta: { count: mockRoleAssignments[roleId].length },
    });
  }),
];

// =============================================================================
// V2 User Groups Count Handler (aggregation)
// =============================================================================

export const userGroupsCountHandler = http.get('/api/rbac/v1/principals/', ({ request }) => {
  const url = new URL(request.url);
  const withGroupCount = url.searchParams.get('add_fields')?.includes('user_groups_count');

  // If requesting group count, add it to the response
  // Note: This is a mock - actual API may need enhancement
  if (withGroupCount) {
    return HttpResponse.json({
      data: [
        {
          username: 'john.doe',
          email: 'john.doe@redhat.com',
          first_name: 'John',
          last_name: 'Doe',
          is_active: true,
          is_org_admin: true,
          user_groups_count: 3,
        },
        {
          username: 'jane.smith',
          email: 'jane.smith@redhat.com',
          first_name: 'Jane',
          last_name: 'Smith',
          is_active: true,
          is_org_admin: false,
          user_groups_count: 2,
        },
      ],
      meta: { count: 2, limit: 20, offset: 0 },
    });
  }

  // Default response without count
  return HttpResponse.json({
    data: [
      {
        username: 'john.doe',
        email: 'john.doe@redhat.com',
        first_name: 'John',
        last_name: 'Doe',
        is_active: true,
        is_org_admin: true,
      },
    ],
    meta: { count: 1, limit: 20, offset: 0 },
  });
});

// =============================================================================
// Export all V2 handlers
// =============================================================================

export const allV2Handlers = [...rolesV2Handlers, userGroupsCountHandler];
