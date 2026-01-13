import { Role } from '../types/entities';

export const defaultRoles: Role[] = [
  {
    uuid: 'role-1',
    name: 'Administrator',
    display_name: 'Administrator',
    description: 'Full administrative access',
    system: true,
    platform_default: true,
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
    // Administrator role is typically in admin default group and Platform Admins
    groups_in: [
      {
        uuid: 'admin-default',
        name: 'Default admin access',
        description: 'Default admin group',
      },
      {
        uuid: 'group-1',
        name: 'Platform Admins',
        description: 'Platform administration team',
      },
    ],
    groups_in_count: 2,
  },
  {
    uuid: 'role-2',
    name: 'Viewer',
    display_name: 'Viewer',
    description: 'Read-only access',
    system: true,
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
    // Viewer role is commonly in multiple groups for read access
    groups_in: [
      {
        uuid: 'system-default',
        name: 'Default access',
        description: 'Default access group',
      },
      {
        uuid: 'group-2',
        name: 'Support Team',
        description: 'Customer support access',
      },
      {
        uuid: 'group-3',
        name: 'Engineering',
        description: 'Engineering team access',
      },
    ],
    groups_in_count: 3,
  },
  {
    uuid: 'role-3',
    name: 'Custom Role',
    display_name: 'Custom Role',
    description: 'Custom role for specific team',
    system: false,
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
    // Custom role assigned to specific team
    groups_in: [
      {
        uuid: 'group-3',
        name: 'Engineering',
        description: 'Engineering team access',
      },
    ],
    groups_in_count: 1,
  },
];
