import { Group, Principal, Role } from '../types/entities';

/**
 * Mock groups for workspace role assignments (M3+ features)
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

/**
 * Mock roles for workspace role assignments (M3+ features)
 * Includes roles for multiple bundles: RHEL, Ansible, OpenShift
 */
export const defaultKesselRoles: Role[] = [
  // RHEL bundle roles
  {
    uuid: 'role-1',
    name: 'Workspace Administrator',
    display_name: 'Workspace Administrator',
    description: 'Full administrative access to workspace',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-10T12:00:00Z',
    policyCount: 1,
    accessCount: 15,
    applications: ['inventory', 'rbac', 'advisor', 'vulnerability', 'compliance'],
  },
  {
    uuid: 'role-2',
    name: 'Workspace Viewer',
    display_name: 'Workspace Viewer',
    description: 'Read-only access to workspace',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-08T10:00:00Z',
    policyCount: 1,
    accessCount: 5,
    applications: ['inventory', 'dashboard', 'advisor'],
  },
  {
    uuid: 'role-3',
    name: 'Workspace Editor',
    display_name: 'Workspace Editor',
    description: 'Edit access to workspace resources',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-12T14:30:00Z',
    policyCount: 1,
    accessCount: 10,
    applications: ['inventory', 'patch', 'drift', 'policies'],
  },
  // Ansible bundle roles
  {
    uuid: 'role-4',
    name: 'Ansible Automation Administrator',
    display_name: 'Ansible Automation Administrator',
    description: 'Full administrative access to Ansible Automation Platform',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-10T12:00:00Z',
    policyCount: 1,
    accessCount: 12,
    applications: ['catalog', 'approval', 'automation-analytics', 'automation-hub'],
  },
  {
    uuid: 'role-5',
    name: 'Ansible Content Manager',
    display_name: 'Ansible Content Manager',
    description: 'Manage Ansible content and collections',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-08T10:00:00Z',
    policyCount: 1,
    accessCount: 8,
    applications: ['catalog', 'automation-hub'],
  },
  // OpenShift bundle roles
  {
    uuid: 'role-6',
    name: 'OpenShift Cluster Administrator',
    display_name: 'OpenShift Cluster Administrator',
    description: 'Full administrative access to OpenShift clusters',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-10T12:00:00Z',
    policyCount: 1,
    accessCount: 20,
    applications: ['cost-management', 'subscriptions', 'ocp-advisor', 'ocm'],
  },
  {
    uuid: 'role-7',
    name: 'OpenShift Viewer',
    display_name: 'OpenShift Viewer',
    description: 'Read-only access to OpenShift resources',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-08T10:00:00Z',
    policyCount: 1,
    accessCount: 6,
    applications: ['cost-management', 'ocp-advisor'],
  },
];

/**
 * Mock group members for drawer Users tab
 */
export const defaultKesselGroupMembers: Map<string, Principal[]> = new Map([
  [
    'group-1',
    [
      {
        username: 'john.doe',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        is_active: true,
        is_org_admin: false,
      },
      {
        username: 'jane.smith',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        is_active: true,
        is_org_admin: false,
      },
      {
        username: 'bob.wilson',
        first_name: 'Bob',
        last_name: 'Wilson',
        email: 'bob.wilson@example.com',
        is_active: true,
        is_org_admin: false,
      },
    ],
  ],
  [
    'group-2',
    [
      {
        username: 'alice.dev',
        first_name: 'Alice',
        last_name: 'Developer',
        email: 'alice.dev@example.com',
        is_active: true,
        is_org_admin: false,
      },
    ],
  ],
  [
    'group-3',
    [
      {
        username: 'viewer.user',
        first_name: 'Viewer',
        last_name: 'User',
        email: 'viewer.user@example.com',
        is_active: true,
        is_org_admin: false,
      },
    ],
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
      {
        username: 'mike.content',
        first_name: 'Mike',
        last_name: 'Content',
        email: 'mike.content@example.com',
        is_active: true,
        is_org_admin: false,
      },
    ],
  ],
]);

/**
 * Mock group roles for drawer Roles tab
 */
export const defaultKesselGroupRoles: Map<string, Role[]> = new Map([
  ['group-1', [defaultKesselRoles[0], defaultKesselRoles[1]]], // Production Admins: Administrator + Viewer
  ['group-2', [defaultKesselRoles[2]]], // Development Team: Editor
  ['group-3', [defaultKesselRoles[1]]], // Viewers: Viewer
  ['group-4', [defaultKesselRoles[2]]], // Marketing Team: Editor
]);
