/**
 * Default seed data for the mock database (shared layer).
 *
 * Exported constants are the single source of truth for shared mock data.
 * Version-specific data lives in src/{v1,v2}/data/mocks/seed.ts.
 */

import type { Group, Principal, ServiceAccount } from './db';
import type { Permission } from '../api/permissions';
import type { MockServiceAccount } from './db';
import type { RoleOut } from '../api/groups';

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

export const DEFAULT_GROUPS: Group[] = [
  {
    uuid: 'admin-default',
    name: 'Default admin access',
    description: 'Default admin group',
    principalCount: 'All org admins',
    roleCount: 0,
    created: '2023-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
    platform_default: false,
    admin_default: true,
    system: true,
  },
  {
    uuid: 'system-default',
    name: 'Default access',
    description: 'Default access group',
    principalCount: 'All',
    roleCount: 0,
    created: '2023-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
    platform_default: true,
    admin_default: false,
    system: true,
  },
  {
    uuid: 'group-1',
    name: 'Platform Admins',
    description: 'Platform administration team',
    principalCount: 5,
    roleCount: 3,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-15T00:00:00Z',
    platform_default: false,
    system: false,
    admin_default: false,
  },
  {
    uuid: 'group-2',
    name: 'Support Team',
    description: 'Customer support access',
    principalCount: 12,
    roleCount: 2,
    created: '2024-01-05T00:00:00Z',
    modified: '2024-01-20T00:00:00Z',
    platform_default: false,
    system: false,
    admin_default: false,
  },
  {
    uuid: 'group-3',
    name: 'Engineering',
    description: 'Engineering team access',
    principalCount: 25,
    roleCount: 5,
    created: '2024-01-10T00:00:00Z',
    modified: '2024-01-25T00:00:00Z',
    platform_default: false,
    system: false,
    admin_default: false,
  },
];

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const DEFAULT_USERS: Principal[] = [
  {
    username: 'john.doe',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    is_org_admin: false,
    external_source_id: 12345,
  },
  {
    username: 'jane.smith',
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_active: true,
    is_org_admin: true,
    external_source_id: 67890,
  },
  {
    username: 'bob.johnson',
    email: 'bob.johnson@example.com',
    first_name: 'Bob',
    last_name: 'Johnson',
    is_active: false,
    is_org_admin: false,
    external_source_id: 11111,
  },
];

// ---------------------------------------------------------------------------
// Permissions (V1 application permissions)
// ---------------------------------------------------------------------------

export const DEFAULT_PERMISSIONS: Permission[] = [
  { permission: 'insights:*:*', application: 'insights', resource_type: '*', verb: '*' },
  { permission: 'cost-management:*:*', application: 'cost-management', resource_type: '*', verb: '*' },
  { permission: 'inventory:hosts:read', application: 'inventory', resource_type: 'hosts', verb: 'read' },
  { permission: 'inventory:hosts:write', application: 'inventory', resource_type: 'hosts', verb: 'write' },
  { permission: 'approval:*:*', application: 'approval', resource_type: '*', verb: '*' },
  { permission: 'catalog:*:*', application: 'catalog', resource_type: '*', verb: '*' },
  { permission: 'sources:*:*', application: 'sources', resource_type: '*', verb: '*' },
  { permission: 'notifications:*:*', application: 'notifications', resource_type: '*', verb: '*' },
];

// ---------------------------------------------------------------------------
// Permission options (for /permissions/options/ endpoint)
// ---------------------------------------------------------------------------

export const DEFAULT_PERMISSION_OPTIONS = {
  applications: ['insights', 'cost-management', 'inventory', 'approval', 'catalog', 'sources', 'notifications'],
  resourceTypes: ['*', 'hosts', 'groups', 'workspace', 'group', 'template'],
  verbs: ['*', 'read', 'write', 'create', 'update', 'delete'],
};

// ---------------------------------------------------------------------------
// Service accounts
// ---------------------------------------------------------------------------

export const DEFAULT_SERVICE_ACCOUNTS: MockServiceAccount[] = [
  {
    uuid: 'sa-1',
    name: 'CI/CD Pipeline',
    clientId: 'pipeline-client-001',
    owner: 'adumble',
    timeCreated: '2023-01-01T10:00:00Z',
    description: 'Service account for CI/CD automation',
  },
  {
    uuid: 'sa-2',
    name: 'Monitoring Agent',
    clientId: 'monitoring-agent-002',
    owner: 'bbunny',
    timeCreated: '2023-02-15T11:00:00Z',
    description: 'Service account for monitoring systems',
  },
  {
    uuid: 'sa-3',
    name: 'Backup Service',
    clientId: 'backup-svc-003',
    owner: 'dzbornak',
    timeCreated: '2023-03-20T14:00:00Z',
    description: 'Service account for backup operations',
  },
  {
    uuid: 'sa-4',
    name: 'API Gateway',
    clientId: 'api-gateway-004',
    owner: 'spetrillo',
    timeCreated: '2023-04-10T09:00:00Z',
    description: 'Service account for API gateway',
  },
  {
    uuid: 'sa-5',
    name: 'Log Collector',
    clientId: 'log-collector-005',
    owner: 'bdevereaux',
    timeCreated: '2023-05-05T16:00:00Z',
    description: 'Service account for log collection',
  },
];

// ---------------------------------------------------------------------------
// Named aliases — import these instead of indexing DEFAULT_* arrays in stories
// ---------------------------------------------------------------------------

export const USER_JOHN = DEFAULT_USERS[0];
export const USER_JANE = DEFAULT_USERS[1];
export const USER_BOB = DEFAULT_USERS[2];

export const GROUP_ADMIN_DEFAULT = DEFAULT_GROUPS[0];
export const GROUP_SYSTEM_DEFAULT = DEFAULT_GROUPS[1];
export const GROUP_PLATFORM_ADMINS = DEFAULT_GROUPS[2];
export const GROUP_SUPPORT_TEAM = DEFAULT_GROUPS[3];
export const GROUP_ENGINEERING = DEFAULT_GROUPS[4];

// ---------------------------------------------------------------------------
// Group-member relation data
// ---------------------------------------------------------------------------

const john = USER_JOHN;
const jane = USER_JANE;
const bob = USER_BOB;

export const DEFAULT_GROUP_MEMBERS: Record<string, Principal[]> = {
  'group-1': [john, jane],
  'group-2': [john, bob],
  'group-3': [john, jane, bob],
};

function toGroupServiceAccount(sa: MockServiceAccount): ServiceAccount {
  return {
    username: sa.clientId,
    type: 'service-account',
    clientId: sa.clientId,
    name: sa.name,
    owner: sa.owner,
    time_created: Math.floor(new Date(sa.timeCreated).getTime() / 1000),
    description: sa.description,
  };
}

export const DEFAULT_GROUP_SERVICE_ACCOUNTS: Record<string, ServiceAccount[]> = {
  'group-1': DEFAULT_SERVICE_ACCOUNTS.slice(0, 2).map(toGroupServiceAccount),
  'group-2': DEFAULT_SERVICE_ACCOUNTS.slice(2, 4).map(toGroupServiceAccount),
  'group-3': DEFAULT_SERVICE_ACCOUNTS.slice(0, 3).map(toGroupServiceAccount),
};

// ---------------------------------------------------------------------------
// Group-role relation data (used by stories)
// ---------------------------------------------------------------------------

export const DEFAULT_GROUP_ROLES: Record<string, RoleOut[]> = {
  'group-1': [
    {
      uuid: 'role-1',
      name: 'Administrator',
      display_name: 'Administrator',
      description: 'Full administrative access',
      system: true,
      platform_default: true,
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
    {
      uuid: 'role-2',
      name: 'Viewer',
      display_name: 'Viewer',
      description: 'Read-only access',
      system: true,
      platform_default: false,
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
  ],
  'group-2': [
    {
      uuid: 'role-2',
      name: 'Viewer',
      display_name: 'Viewer',
      description: 'Read-only access',
      system: true,
      platform_default: false,
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
  ],
  'group-3': [
    {
      uuid: 'role-2',
      name: 'Viewer',
      display_name: 'Viewer',
      description: 'Read-only access',
      system: true,
      platform_default: false,
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
    {
      uuid: 'role-3',
      name: 'Custom Role',
      display_name: 'Custom Role',
      description: 'Custom role for specific team',
      system: false,
      platform_default: false,
      created: '2024-01-15T00:00:00Z',
      modified: '2024-01-20T00:00:00Z',
    },
  ],
};

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Generate N synthetic users for pagination tests */
export function generateUsers(count: number): Principal[] {
  return Array.from({ length: count }, (_, i) => ({
    username: `user${String(i + 1).padStart(3, '0')}`,
    email: `user${i + 1}@company.com`,
    first_name: 'User',
    last_name: `${i + 1}`,
    is_active: true,
    is_org_admin: false,
    external_source_id: String(200 + i),
  }));
}
