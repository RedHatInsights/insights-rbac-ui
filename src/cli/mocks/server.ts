/**
 * MSW Server Setup for CLI Tests
 *
 * Reuses the existing stateful handlers from Storybook for consistency
 * between visual tests and CLI integration tests.
 *
 * The handlers maintain state internally and expose a /api/test/reset-state
 * endpoint that can be called to reset state between tests.
 */

import { setupServer } from 'msw/node';
import { createStatefulHandlers } from '../../../.storybook/helpers/stateful-handlers';
import { AppState } from '../../../.storybook/helpers/immutable-state';

// ============================================================================
// Default Initial State for CLI Tests
// ============================================================================

// Initialize Maps for group relationships
const groupMembers = new Map<string, Array<{ username: string; email?: string; first_name?: string; last_name?: string; is_active?: boolean }>>();
groupMembers.set('group-1', [
  { username: 'testuser1', email: 'test1@example.com', first_name: 'Test', last_name: 'User1', is_active: true },
  { username: 'testuser2', email: 'test2@example.com', first_name: 'Test', last_name: 'User2', is_active: true },
]);

const groupRoles = new Map<string, Array<{ uuid: string; name: string; description?: string; system?: boolean }>>();
groupRoles.set('group-1', [{ uuid: 'role-1', name: 'Test Role 1', description: 'A test role', system: false }]);

const workspaceRoleBindings = new Map<string, Array<{ subject?: { id: string }; role?: { id: string } }>>();

const defaultInitialState: Partial<AppState> = {
  groupMembers,
  groupRoles,
  workspaceRoleBindings,
  roles: [
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
  ],
  groups: [
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
  ],
  users: [
    {
      username: 'testuser1',
      email: 'test1@example.com',
      first_name: 'Test',
      last_name: 'User1',
      is_active: true,
      is_org_admin: false,
    },
    {
      username: 'testuser2',
      email: 'test2@example.com',
      first_name: 'Test',
      last_name: 'User2',
      is_active: true,
      is_org_admin: true,
    },
  ],
  workspaces: [
    {
      id: 'ws-root',
      name: 'Root Workspace',
      description: 'The root workspace',
      parent_id: '',
      type: 'root',
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'ws-default',
      name: 'Default Workspace',
      description: 'The default workspace for all users',
      parent_id: 'ws-root',
      type: 'default',
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'ws-dev',
      name: 'Development',
      description: 'Development team workspace',
      parent_id: 'ws-root',
      type: 'standard',
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'ws-prod',
      name: 'Production',
      description: 'Production team workspace',
      parent_id: 'ws-root',
      type: 'standard',
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'ws-dev-frontend',
      name: 'Frontend',
      description: 'Frontend development',
      parent_id: 'ws-dev',
      type: 'standard',
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'ws-dev-backend',
      name: 'Backend',
      description: 'Backend development',
      parent_id: 'ws-dev',
      type: 'standard',
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
  ],
};

// ============================================================================
// Server Setup
// ============================================================================

// Create handlers with the default initial state
const handlers = createStatefulHandlers(defaultInitialState);

// Create and export the MSW server
export const server = setupServer(...handlers);

// ============================================================================
// Reset Function
// ============================================================================

/**
 * Reset mock data to initial state.
 * This recreates the handlers with fresh state.
 */
export function resetMockData(): void {
  const freshHandlers = createStatefulHandlers(defaultInitialState);
  server.resetHandlers(...freshHandlers);
}

/**
 * Reset with custom initial state.
 */
export function resetMockDataWithState(initialState: Partial<AppState>): void {
  const freshHandlers = createStatefulHandlers({ ...defaultInitialState, ...initialState });
  server.resetHandlers(...freshHandlers);
}
