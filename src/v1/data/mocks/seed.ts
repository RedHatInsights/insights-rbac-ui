import type { RoleOutDynamic } from '../api/roles';
import type { V1Seed } from './db';
import {
  DEFAULT_GROUPS,
  DEFAULT_GROUP_MEMBERS,
  DEFAULT_GROUP_ROLES,
  DEFAULT_GROUP_SERVICE_ACCOUNTS,
  DEFAULT_PERMISSIONS,
  DEFAULT_SERVICE_ACCOUNTS,
  DEFAULT_USERS,
} from '../../../shared/data/mocks/seed';

export const DEFAULT_V1_ROLES: RoleOutDynamic[] = [
  {
    uuid: 'role-1',
    name: 'Administrator',
    display_name: 'Administrator',
    description: 'Full administrative access',
    system: true,
    platform_default: true,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
    policyCount: 10,
    accessCount: 50,
    applications: ['inventory', 'rbac', 'advisor', 'vulnerability', 'compliance', 'cost-management', 'insights'],
    access: [
      { permission: 'rbac:*:*', resourceDefinitions: [] },
      { permission: 'cost-management:*:*', resourceDefinitions: [] },
      { permission: 'insights:*:*', resourceDefinitions: [] },
      { permission: 'inventory:*:*', resourceDefinitions: [] },
      { permission: 'advisor:*:*', resourceDefinitions: [] },
      { permission: 'vulnerability:*:*', resourceDefinitions: [] },
      { permission: 'compliance:*:*', resourceDefinitions: [] },
    ],
    groups_in: [
      { uuid: 'admin-default', name: 'Default admin access', description: 'Default admin group' },
      { uuid: 'group-1', name: 'Platform Admins', description: 'Platform administration team' },
    ],
    groups_in_count: 2,
  },
  {
    uuid: 'role-2',
    name: 'Viewer',
    display_name: 'Viewer',
    description: 'Read-only access',
    system: true,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
    policyCount: 5,
    accessCount: 20,
    applications: ['inventory', 'rbac', 'advisor', 'vulnerability', 'compliance'],
    access: [
      { permission: 'rbac:group:read', resourceDefinitions: [] },
      { permission: 'rbac:role:read', resourceDefinitions: [] },
      { permission: 'inventory:hosts:read', resourceDefinitions: [] },
      { permission: 'advisor:*:read', resourceDefinitions: [] },
      { permission: 'vulnerability:*:read', resourceDefinitions: [] },
    ],
    groups_in: [
      { uuid: 'system-default', name: 'Default access', description: 'Default access group' },
      { uuid: 'group-2', name: 'Support Team', description: 'Customer support access' },
      { uuid: 'group-3', name: 'Engineering', description: 'Engineering team access' },
    ],
    groups_in_count: 3,
  },
  {
    uuid: 'role-3',
    name: 'Custom Role',
    display_name: 'Custom Role',
    description: 'Custom role for specific team',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-15T00:00:00Z',
    modified: '2024-01-20T00:00:00Z',
    policyCount: 3,
    accessCount: 15,
    applications: ['inventory', 'insights', 'advisor'],
    access: [
      { permission: 'insights:hosts:read', resourceDefinitions: [] },
      { permission: 'inventory:hosts:read', resourceDefinitions: [] },
      { permission: 'advisor:*:read', resourceDefinitions: [] },
    ],
    groups_in: [{ uuid: 'group-3', name: 'Engineering', description: 'Engineering team access' }],
    groups_in_count: 1,
  },
  {
    uuid: 'role-4',
    name: 'Insights Analyst',
    display_name: 'Insights Analyst',
    description: 'Analyze insights data',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-02-01T00:00:00Z',
    modified: '2024-02-01T00:00:00Z',
    policyCount: 1,
    accessCount: 3,
    applications: ['insights', 'advisor'],
    access: [{ permission: 'insights:*:read', resourceDefinitions: [] }],
    groups_in: [],
    groups_in_count: 0,
  },
  {
    uuid: 'role-5',
    name: 'Compliance Auditor',
    display_name: 'Compliance Auditor',
    description: 'Audit compliance reports',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-02-01T00:00:00Z',
    modified: '2024-02-01T00:00:00Z',
    policyCount: 1,
    accessCount: 2,
    applications: ['compliance'],
    access: [{ permission: 'compliance:*:read', resourceDefinitions: [] }],
    groups_in: [],
    groups_in_count: 0,
  },
];

// Named aliases — import these instead of indexing DEFAULT_V1_ROLES in stories
export const V1_ROLE_ADMIN = DEFAULT_V1_ROLES[0];
export const V1_ROLE_VIEWER = DEFAULT_V1_ROLES[1];
export const V1_ROLE_CUSTOM = DEFAULT_V1_ROLES[2];
export const V1_ROLE_INSIGHTS_ANALYST = DEFAULT_V1_ROLES[3];
export const V1_ROLE_COMPLIANCE_AUDITOR = DEFAULT_V1_ROLES[4];

/** Default seed data for a fully-populated V1 mock database. */
export function defaultV1Seed(): V1Seed {
  return {
    groups: DEFAULT_GROUPS,
    users: DEFAULT_USERS,
    roles: DEFAULT_V1_ROLES,
    permissions: DEFAULT_PERMISSIONS,
    serviceAccounts: DEFAULT_SERVICE_ACCOUNTS,
    groupMembers: Object.entries(DEFAULT_GROUP_MEMBERS),
    groupServiceAccounts: Object.entries(DEFAULT_GROUP_SERVICE_ACCOUNTS),
    groupRoles: Object.entries(DEFAULT_GROUP_ROLES),
  };
}
