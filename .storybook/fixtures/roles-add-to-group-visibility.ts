import { Role } from '../types/entities';

/**
 * Test fixtures for the "Add role to this group" link visibility test.
 * These roles are specifically configured to test the visibility logic.
 */
export const rolesAddToGroupVisibilityFixtures: Role[] = [
  {
    uuid: 'role-test-1',
    name: 'Test Role With Groups',
    display_name: 'Test Role With Groups',
    description: 'A test role assigned to multiple groups including admin',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 3,
    applications: ['insights'],
    access: [{ permission: 'insights:*:read', resourceDefinitions: [] }],
    // Include both regular groups AND the admin group
    groups_in: [
      {
        uuid: 'group-1',
        name: 'Platform Admins',
        description: 'Platform administration team',
      },
      {
        uuid: 'admin-default',
        name: 'Default admin access',
        description: 'Default admin group',
      },
      {
        uuid: 'group-2',
        name: 'Support Team',
        description: 'Customer support access',
      },
    ],
    groups_in_count: 3,
  },
  {
    uuid: 'role-test-2',
    name: 'Another Test Role',
    display_name: 'Another Test Role',
    description: 'A role only in regular groups',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-02T00:00:00Z',
    modified: '2024-01-02T00:00:00Z',
    policyCount: 1,
    accessCount: 2,
    applications: ['inventory'],
    access: [{ permission: 'inventory:hosts:read', resourceDefinitions: [] }],
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
