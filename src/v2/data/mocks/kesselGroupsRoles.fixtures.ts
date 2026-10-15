import type { Group } from '../../../shared/data/queries/groups';
import type { Principal } from '../../../shared/data/api/users';
import type { RoleOut } from '../../../shared/data/mocks/db';
import type { Permission } from '../api/roles';
import type { Role } from '../queries/roles';
import { MOCK_ORG_ID } from './seed';

/**
 * Mock groups for workspace role assignments (M3+ features).
 * Groups have no V2 equivalent yet -- V1 shape is correct here.
 */
export const defaultKesselGroups: Group[] = [
  {
    uuid: 'group-1',
    name: 'Production Admins',
    description: 'Administrators for production environment',
    principalCount: 5,
    roleCount: 2,
    created: '2024-01-15T10:30:00Z',
    modified: '2024-01-20T14:45:00Z',
  },
  {
    uuid: 'group-2',
    name: 'Development Team',
    description: 'Development environment access',
    principalCount: 12,
    roleCount: 3,
    created: '2024-01-10T09:00:00Z',
    modified: '2024-01-18T16:20:00Z',
  },
  {
    uuid: 'group-3',
    name: 'Viewers',
    description: 'Read-only access to production',
    principalCount: 25,
    roleCount: 1,
    created: '2024-01-05T11:15:00Z',
    modified: '2024-01-15T13:30:00Z',
  },
  {
    uuid: 'group-4',
    name: 'Marketing Team',
    description: 'Marketing department access',
    principalCount: 8,
    roleCount: 1,
    created: '2024-01-08T13:00:00Z',
    modified: '2024-01-16T09:30:00Z',
  },
];

export const KESSEL_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  'kessel-role-1': [
    { application: 'inventory', resource_type: 'hosts', operation: 'read' },
    { application: 'inventory', resource_type: 'hosts', operation: 'write' },
    { application: 'rbac', resource_type: 'role', operation: 'read' },
    { application: 'rbac', resource_type: 'role', operation: 'write' },
    { application: 'rbac', resource_type: 'group', operation: 'read' },
    { application: 'rbac', resource_type: 'group', operation: 'write' },
  ],
  'kessel-role-2': [
    { application: 'inventory', resource_type: 'hosts', operation: 'read' },
    { application: 'advisor', resource_type: 'recommendation', operation: 'read' },
  ],
  'kessel-role-3': [
    { application: 'inventory', resource_type: 'hosts', operation: 'read' },
    { application: 'inventory', resource_type: 'hosts', operation: 'write' },
    { application: 'patch', resource_type: 'patch', operation: 'read' },
    { application: 'patch', resource_type: 'patch', operation: 'write' },
  ],
  'kessel-role-4': [
    { application: 'catalog', resource_type: 'portfolios', operation: 'read' },
    { application: 'catalog', resource_type: 'portfolios', operation: 'write' },
    { application: 'automation-hub', resource_type: 'namespaces', operation: 'read' },
    { application: 'automation-hub', resource_type: 'namespaces', operation: 'write' },
  ],
  'kessel-role-5': [
    { application: 'catalog', resource_type: 'portfolios', operation: 'read' },
    { application: 'automation-hub', resource_type: 'namespaces', operation: 'read' },
  ],
  'kessel-role-6': [
    { application: 'cost-management', resource_type: 'cost_model', operation: 'read' },
    { application: 'cost-management', resource_type: 'cost_model', operation: 'write' },
    { application: 'subscriptions', resource_type: 'products', operation: 'read' },
  ],
  'kessel-role-7': [{ application: 'cost-management', resource_type: 'cost_model', operation: 'read' }],
};

/**
 * V2-shaped roles for workspace role assignments (M3+ features).
 * Includes roles for multiple bundles: RHEL, Ansible, OpenShift.
 */
export const defaultKesselRoles: Role[] = [
  {
    id: 'kessel-role-1',
    name: 'Workspace Administrator',
    description: 'Full administrative access to workspace',
    org_id: MOCK_ORG_ID,
    permissions: KESSEL_ROLE_PERMISSIONS['kessel-role-1'],
    permissions_count: 6,
    last_modified: '2024-01-10T12:00:00Z',
  },
  {
    id: 'kessel-role-2',
    name: 'Workspace Viewer',
    description: 'Read-only access to workspace',
    org_id: MOCK_ORG_ID,
    permissions: KESSEL_ROLE_PERMISSIONS['kessel-role-2'],
    permissions_count: 2,
    last_modified: '2024-01-08T10:00:00Z',
  },
  {
    id: 'kessel-role-3',
    name: 'Workspace Editor',
    description: 'Edit access to workspace resources',
    org_id: MOCK_ORG_ID,
    permissions: KESSEL_ROLE_PERMISSIONS['kessel-role-3'],
    permissions_count: 4,
    last_modified: '2024-01-12T14:30:00Z',
  },
  {
    id: 'kessel-role-4',
    name: 'Ansible Automation Administrator',
    description: 'Full administrative access to Ansible Automation Platform',
    org_id: MOCK_ORG_ID,
    permissions: KESSEL_ROLE_PERMISSIONS['kessel-role-4'],
    permissions_count: 4,
    last_modified: '2024-01-10T12:00:00Z',
  },
  {
    id: 'kessel-role-5',
    name: 'Ansible Content Manager',
    description: 'Manage Ansible content and collections',
    org_id: MOCK_ORG_ID,
    permissions: KESSEL_ROLE_PERMISSIONS['kessel-role-5'],
    permissions_count: 2,
    last_modified: '2024-01-08T10:00:00Z',
  },
  {
    id: 'kessel-role-6',
    name: 'OpenShift Cluster Administrator',
    description: 'Full administrative access to OpenShift clusters',
    org_id: MOCK_ORG_ID,
    permissions: KESSEL_ROLE_PERMISSIONS['kessel-role-6'],
    permissions_count: 3,
    last_modified: '2024-01-10T12:00:00Z',
  },
  {
    id: 'kessel-role-7',
    name: 'OpenShift Viewer',
    description: 'Read-only access to OpenShift resources',
    org_id: MOCK_ORG_ID,
    permissions: KESSEL_ROLE_PERMISSIONS['kessel-role-7'],
    permissions_count: 1,
    last_modified: '2024-01-08T10:00:00Z',
  },
];

// Named aliases — import these instead of indexing defaultKessel* arrays
export const KESSEL_GROUP_PROD_ADMINS = defaultKesselGroups[0];
export const KESSEL_GROUP_DEV_TEAM = defaultKesselGroups[1];
export const KESSEL_GROUP_VIEWERS = defaultKesselGroups[2];
export const KESSEL_GROUP_MARKETING = defaultKesselGroups[3];

export const KESSEL_ROLE_WS_ADMIN = defaultKesselRoles[0];
export const KESSEL_ROLE_WS_VIEWER = defaultKesselRoles[1];
export const KESSEL_ROLE_WS_EDITOR = defaultKesselRoles[2];

/**
 * Maps resource types to kessel role IDs assignable at that level.
 * Used by MSW handlers to simulate backend resource_type filtering.
 */
export const KESSEL_ROLES_BY_RESOURCE_TYPE: Record<string, string[]> = {
  tenant: ['kessel-role-1', 'kessel-role-2', 'kessel-role-6', 'kessel-role-7'],
  workspace: ['kessel-role-1', 'kessel-role-2', 'kessel-role-3', 'kessel-role-4', 'kessel-role-5'],
};

/**
 * Mock group members for drawer Users tab
 */
export const defaultKesselGroupMembers: Map<string, Principal[]> = new Map([
  [
    'group-1',
    [
      { username: 'john.doe', first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', is_active: true, is_org_admin: false },
      { username: 'jane.smith', first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com', is_active: true, is_org_admin: false },
      { username: 'bob.wilson', first_name: 'Bob', last_name: 'Wilson', email: 'bob.wilson@example.com', is_active: true, is_org_admin: false },
    ],
  ],
  [
    'group-2',
    [{ username: 'alice.dev', first_name: 'Alice', last_name: 'Developer', email: 'alice.dev@example.com', is_active: true, is_org_admin: false }],
  ],
  [
    'group-3',
    [{ username: 'viewer.user', first_name: 'Viewer', last_name: 'User', email: 'viewer.user@example.com', is_active: true, is_org_admin: false }],
  ],
  [
    'group-4',
    [
      {
        username: 'sarah.marketing',
        first_name: 'Sarah',
        last_name: 'Marketing',
        email: 'sarah.marketing@example.com',
        is_active: true,
        is_org_admin: false,
      },
      { username: 'mike.content', first_name: 'Mike', last_name: 'Content', email: 'mike.content@example.com', is_active: true, is_org_admin: false },
    ],
  ],
]);

export const KESSEL_PROD_ADMINS_MEMBERS = defaultKesselGroupMembers.get(KESSEL_GROUP_PROD_ADMINS.uuid)!;
export const KESSEL_VIEWERS_MEMBERS = defaultKesselGroupMembers.get(KESSEL_GROUP_VIEWERS.uuid)!;

/**
 * V1-shaped role summaries for the group-roles drawer.
 * groupRoles map expects RoleOut[] (V1 shape with uuid).
 */
const kesselGroupRoleEntries: RoleOut[] = defaultKesselRoles.map((r) => ({
  uuid: r.id!,
  name: r.name!,
  description: r.description,
  system: false,
  created: r.last_modified ?? '2024-01-01T00:00:00Z',
  modified: r.last_modified ?? '2024-01-01T00:00:00Z',
}));

/**
 * Mock group roles for drawer Roles tab
 */
export const defaultKesselGroupRoles: Map<string, RoleOut[]> = new Map([
  ['group-1', [kesselGroupRoleEntries[0], kesselGroupRoleEntries[1]]],
  ['group-2', [kesselGroupRoleEntries[2]]],
  ['group-3', [kesselGroupRoleEntries[1]]],
  ['group-4', [kesselGroupRoleEntries[2]]],
]);
