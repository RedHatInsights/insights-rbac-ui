import type { Permission } from '../api/roles';
import type { Role } from '../queries/roles';
import type { WorkspacesWorkspace } from '../api/workspaces';
import type { RoleBinding } from '../queries/roleBindings';
import type { V2Seed } from './db';
import {
  DEFAULT_GROUPS,
  DEFAULT_GROUP_MEMBERS,
  DEFAULT_GROUP_ROLES,
  DEFAULT_GROUP_SERVICE_ACCOUNTS,
  DEFAULT_PERMISSIONS,
  DEFAULT_SERVICE_ACCOUNTS,
  DEFAULT_USERS,
  GROUP_ENGINEERING,
  GROUP_PLATFORM_ADMINS,
  GROUP_SUPPORT_TEAM,
  USER_JANE,
  USER_JOHN,
} from '../../../shared/data/mocks/seed';

export const DEFAULT_V2_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  'role-tenant-admin': [
    { application: 'rbac', resource_type: 'principal', operation: 'read' },
    { application: 'rbac', resource_type: 'group', operation: 'read' },
    { application: 'rbac', resource_type: 'group', operation: 'write' },
    { application: 'rbac', resource_type: 'role', operation: 'read' },
    { application: 'rbac', resource_type: 'role', operation: 'write' },
  ],
  'role-workspace-admin': [
    { application: 'inventory', resource_type: 'groups', operation: 'read' },
    { application: 'inventory', resource_type: 'groups', operation: 'write' },
    { application: 'rbac', resource_type: 'group', operation: 'read' },
    { application: 'rbac', resource_type: 'role', operation: 'read' },
  ],
  'role-rhel-devops': [
    { application: 'inventory', resource_type: 'hosts', operation: 'read' },
    { application: 'inventory', resource_type: 'hosts', operation: 'write' },
    { application: 'inventory', resource_type: 'groups', operation: 'read' },
  ],
  'role-inventory-viewer': [{ application: 'inventory', resource_type: 'hosts', operation: 'read' }],
};

/** Org ID used for user-created mock roles. Matches the identity in KesselAppEntryWithRouter. */
export const MOCK_ORG_ID = '12510751';

export const DEFAULT_V2_ROLES: Role[] = [
  {
    id: 'role-tenant-admin',
    name: 'Tenant admin',
    description: 'Manage all tenant-level resources',
    org_id: undefined,
    permissions: DEFAULT_V2_ROLE_PERMISSIONS['role-tenant-admin'],
    permissions_count: 5,
    last_modified: '2024-06-01T00:00:00Z',
  },
  {
    id: 'role-workspace-admin',
    name: 'Workspace admin',
    description: 'Manage workspace resources',
    org_id: undefined,
    permissions: DEFAULT_V2_ROLE_PERMISSIONS['role-workspace-admin'],
    permissions_count: 4,
    last_modified: '2024-06-01T00:00:00Z',
  },
  {
    id: 'role-rhel-devops',
    name: 'RHEL DevOps',
    description: 'DevOps for RHEL systems',
    org_id: MOCK_ORG_ID,
    permissions: DEFAULT_V2_ROLE_PERMISSIONS['role-rhel-devops'],
    permissions_count: 3,
    last_modified: '2024-05-15T00:00:00Z',
  },
  {
    id: 'role-inventory-viewer',
    name: 'Inventory Viewer',
    description: 'View inventory data',
    org_id: MOCK_ORG_ID,
    permissions: DEFAULT_V2_ROLE_PERMISSIONS['role-inventory-viewer'],
    permissions_count: 1,
    last_modified: '2024-05-01T00:00:00Z',
  },
];

/**
 * Maps resource types to role IDs assignable at that level.
 * Used by MSW handlers to simulate backend resource_type filtering.
 */
export const ROLES_BY_RESOURCE_TYPE: Record<string, string[]> = {
  tenant: ['role-tenant-admin'],
  workspace: ['role-workspace-admin', 'role-rhel-devops', 'role-inventory-viewer'],
};

export const DEFAULT_WORKSPACES: WorkspacesWorkspace[] = [
  {
    id: 'root-1',
    name: 'Root Workspace',
    description: '',
    parent_id: undefined,
    type: 'root',
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'default-1',
    name: 'Default Workspace',
    description: 'Default workspace for the organization',
    parent_id: 'root-1',
    type: 'standard',
    created: '2024-01-01T12:00:00Z',
    modified: '2024-01-01T12:00:00Z',
  },
  {
    id: 'ws-1',
    name: 'Production',
    description: 'Production environment workspace',
    parent_id: 'default-1',
    type: 'standard',
    created: '2024-01-02T00:00:00Z',
    modified: '2024-01-02T00:00:00Z',
  },
  {
    id: 'ws-2',
    name: 'Development',
    description: 'Development environment workspace',
    parent_id: 'default-1',
    type: 'standard',
    created: '2024-01-03T00:00:00Z',
    modified: '2024-01-03T00:00:00Z',
  },
  {
    id: 'ws-3',
    name: 'Staging',
    description: 'Staging environment workspace',
    parent_id: 'default-1',
    type: 'standard',
    created: '2024-01-04T00:00:00Z',
    modified: '2024-01-04T00:00:00Z',
  },
];

// Named aliases — import these instead of indexing DEFAULT_V2_ROLES / DEFAULT_WORKSPACES
export const V2_ROLE_TENANT_ADMIN = DEFAULT_V2_ROLES[0];
export const V2_ROLE_WORKSPACE_ADMIN = DEFAULT_V2_ROLES[1];
export const V2_ROLE_RHEL_DEVOPS = DEFAULT_V2_ROLES[2];
export const V2_ROLE_INVENTORY_VIEWER = DEFAULT_V2_ROLES[3];

export const WS_ROOT = DEFAULT_WORKSPACES[0];
export const WS_DEFAULT = DEFAULT_WORKSPACES[1];
export const WS_PRODUCTION = DEFAULT_WORKSPACES[2];
export const WS_DEVELOPMENT = DEFAULT_WORKSPACES[3];
export const WS_STAGING = DEFAULT_WORKSPACES[4];

// ---------------------------------------------------------------------------
// Role bindings (strict domain type from RoleBinding in queries/roleBindings.ts)
// ---------------------------------------------------------------------------

export const DEFAULT_ROLE_BINDINGS: RoleBinding[] = [
  {
    role: { id: V2_ROLE_TENANT_ADMIN.id!, name: V2_ROLE_TENANT_ADMIN.name! },
    subject: { id: GROUP_PLATFORM_ADMINS.uuid, type: 'group' },
    resource: { id: WS_PRODUCTION.id!, name: WS_PRODUCTION.name!, type: 'workspace' },
  },
  {
    role: { id: V2_ROLE_WORKSPACE_ADMIN.id!, name: V2_ROLE_WORKSPACE_ADMIN.name! },
    subject: { id: GROUP_PLATFORM_ADMINS.uuid, type: 'group' },
    resource: { id: WS_DEVELOPMENT.id!, name: WS_DEVELOPMENT.name!, type: 'workspace' },
  },
  {
    role: { id: V2_ROLE_RHEL_DEVOPS.id!, name: V2_ROLE_RHEL_DEVOPS.name! },
    subject: { id: GROUP_ENGINEERING.uuid, type: 'group' },
    resource: { id: WS_STAGING.id!, name: WS_STAGING.name!, type: 'workspace' },
  },
  {
    role: { id: V2_ROLE_TENANT_ADMIN.id!, name: V2_ROLE_TENANT_ADMIN.name! },
    subject: { id: USER_JOHN.username, type: 'user', groupName: GROUP_PLATFORM_ADMINS.name },
    resource: { id: WS_PRODUCTION.id!, name: WS_PRODUCTION.name!, type: 'workspace' },
  },
  {
    role: { id: V2_ROLE_INVENTORY_VIEWER.id!, name: V2_ROLE_INVENTORY_VIEWER.name! },
    subject: { id: USER_JANE.username, type: 'user', groupName: GROUP_SUPPORT_TEAM.name },
    resource: { id: WS_DEVELOPMENT.id!, name: WS_DEVELOPMENT.name!, type: 'workspace' },
  },
];

export const BINDING_TENANT_ADMIN_ADMINS_PROD = DEFAULT_ROLE_BINDINGS[0];
export const BINDING_WS_ADMIN_ADMINS_DEV = DEFAULT_ROLE_BINDINGS[1];
export const BINDING_RHEL_DEVOPS_ENGINEERING_STAGING = DEFAULT_ROLE_BINDINGS[2];
export const BINDING_TENANT_ADMIN_JOHN_PROD = DEFAULT_ROLE_BINDINGS[3];
export const BINDING_INVENTORY_VIEWER_JANE_DEV = DEFAULT_ROLE_BINDINGS[4];

/** Default seed data for a fully-populated V2 mock database. */
export function defaultV2Seed(): V2Seed {
  return {
    groups: DEFAULT_GROUPS,
    users: DEFAULT_USERS,
    roles: DEFAULT_V2_ROLES,
    workspaces: DEFAULT_WORKSPACES,
    permissions: DEFAULT_PERMISSIONS,
    serviceAccounts: DEFAULT_SERVICE_ACCOUNTS,
    groupMembers: Object.entries(DEFAULT_GROUP_MEMBERS),
    groupServiceAccounts: Object.entries(DEFAULT_GROUP_SERVICE_ACCOUNTS),
    groupRoles: Object.entries(DEFAULT_GROUP_ROLES),
  };
}
