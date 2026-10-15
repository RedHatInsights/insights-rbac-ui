/**
 * MSW Server Setup for CLI Tests
 *
 * Uses the V1MockDb for stateful mock data, matching the Storybook
 * handler factories. V2 workspace + role-binding handlers are wired
 * from the data-layer factories (no inline handlers).
 */

import { setupServer } from 'msw/node';
import { type V1Seed, createV1MockDb } from '../../v1/data/mocks/db';
import { createV1Handlers } from '../../v1/data/mocks/handlers';
import type { RoleOutDynamic } from '../../v1/data/mocks/db';
import type { Group, Principal } from '../../shared/data/mocks/db';
import type { WorkspacesWorkspace } from '../../v2/data/mocks/db';
import { createResettableCollection, createResettableMap } from '../../shared/data/mocks/db';
import { createWorkspacesHandlers } from '../../v2/data/mocks/workspaces.handlers';
import { createRoleBindingsHandlers, createRoleBindingsListHandlers } from '../../v2/data/mocks/roleBindings.handlers';

// ============================================================================
// Default Initial State for CLI Tests
// ============================================================================

const CLI_ROLES: RoleOutDynamic[] = [
  {
    uuid: 'role-1',
    name: 'Test Role 1',
    display_name: 'Test Role 1',
    description: 'A test role for unit tests',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 2,
    applications: ['rbac'],
    access: [
      { permission: 'rbac:role:read', resourceDefinitions: [] },
      { permission: 'rbac:role:write', resourceDefinitions: [] },
    ],
    groups_in: [],
    groups_in_count: 0,
  },
  {
    uuid: 'role-2',
    name: 'System Admin Role',
    display_name: 'System Admin Role',
    description: 'A system role that cannot be deleted',
    system: true,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 5,
    applications: ['rbac', 'inventory'],
    access: [
      { permission: 'rbac:*:*', resourceDefinitions: [] },
      { permission: 'inventory:*:*', resourceDefinitions: [] },
    ],
    groups_in: [],
    groups_in_count: 0,
  },
  {
    uuid: 'role-3',
    name: 'Viewer Role',
    display_name: 'Viewer Role',
    description: 'Read-only access role',
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 1,
    applications: ['rbac'],
    access: [{ permission: 'inventory:hosts:read', resourceDefinitions: [] }],
    groups_in: [],
    groups_in_count: 0,
  },
];

const CLI_GROUPS: Group[] = [
  {
    uuid: 'group-1',
    name: 'Test Group 1',
    description: 'A test group',
    principalCount: 2,
    roleCount: 1,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
];

const CLI_USERS: Principal[] = [
  { username: 'testuser1', email: 'test1@example.com', first_name: 'Test', last_name: 'User1', is_active: true, is_org_admin: false },
  { username: 'testuser2', email: 'test2@example.com', first_name: 'Test', last_name: 'User2', is_active: true, is_org_admin: true },
];

const CLI_WORKSPACES: WorkspacesWorkspace[] = [
  {
    id: 'root-ws',
    name: 'Root Workspace',
    description: '',
    parent_id: undefined,
    type: 'root',
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ws-default',
    name: 'Default Workspace',
    description: 'Default workspace',
    parent_id: 'root-ws',
    type: 'default',
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ws-dev',
    name: 'Development',
    description: 'Development environment',
    parent_id: 'root-ws',
    type: 'standard',
    created: '2024-01-02T00:00:00Z',
    modified: '2024-01-02T00:00:00Z',
  },
  {
    id: 'ws-prod',
    name: 'Production',
    description: 'Production environment',
    parent_id: 'root-ws',
    type: 'standard',
    created: '2024-01-03T00:00:00Z',
    modified: '2024-01-03T00:00:00Z',
  },
  {
    id: 'ws-frontend',
    name: 'Frontend',
    description: 'Frontend team',
    parent_id: 'ws-dev',
    type: 'standard',
    created: '2024-01-04T00:00:00Z',
    modified: '2024-01-04T00:00:00Z',
  },
  {
    id: 'ws-backend',
    name: 'Backend',
    description: 'Backend team',
    parent_id: 'ws-dev',
    type: 'standard',
    created: '2024-01-05T00:00:00Z',
    modified: '2024-01-05T00:00:00Z',
  },
];

const defaultSeed: V1Seed = {
  groups: CLI_GROUPS,
  users: CLI_USERS,
  roles: CLI_ROLES,
  groupMembers: [
    [
      'group-1',
      [
        { username: 'testuser1', email: 'test1@example.com', first_name: 'Test', last_name: 'User1', is_active: true, is_org_admin: false },
        { username: 'testuser2', email: 'test2@example.com', first_name: 'Test', last_name: 'User2', is_active: true, is_org_admin: true },
      ],
    ],
  ],
  groupRoles: [
    [
      'group-1',
      [
        {
          uuid: 'role-1',
          name: 'Test Role 1',
          display_name: 'Test Role 1',
          description: 'A test role',
          system: false,
          platform_default: false,
          created: '2024-01-01T00:00:00Z',
          modified: '2024-01-01T00:00:00Z',
        },
      ],
    ],
  ],
};

// ============================================================================
// Server Setup
// ============================================================================

const db = createV1MockDb(defaultSeed);
const v1Handlers = createV1Handlers(db);

const workspacesCollection = createResettableCollection<WorkspacesWorkspace>(CLI_WORKSPACES);
const roleBindingsMap = createResettableMap<string, never[]>([]);
const workspacesHandlers = createWorkspacesHandlers(workspacesCollection);
const roleBindingsHandlers = createRoleBindingsHandlers([]);
const roleBindingsListHandlers = createRoleBindingsListHandlers([]);

export const server = setupServer(...v1Handlers, ...workspacesHandlers, ...roleBindingsHandlers, ...roleBindingsListHandlers);

// ============================================================================
// Reset Function
// ============================================================================

/** Reset mock data to initial state. */
export function resetMockData(): void {
  db.reset();
  workspacesCollection.reset();
  roleBindingsMap.reset();
}

/** Reset with custom initial state by creating a fresh db and handlers. */
export function resetMockDataWithState(seed: Partial<V1Seed>): void {
  const freshDb = createV1MockDb({ ...defaultSeed, ...seed });
  const freshHandlers = createV1Handlers(freshDb);
  server.resetHandlers(...freshHandlers, ...workspacesHandlers, ...roleBindingsHandlers);
}
