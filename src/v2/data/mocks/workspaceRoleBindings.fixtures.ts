import type { RoleBindingsRoleBindingBySubject } from '../queries/workspaces';

type RoleBindingBySubject = RoleBindingsRoleBindingBySubject;

/**
 * Workspace-specific role bindings for M3+ stories
 *
 * Structure: Map<workspaceId, RoleBindingBySubject[]>
 *
 * This creates variance across workspaces:
 * - Production (ws-1): Has Production Admins and Viewers groups
 * - Development (ws-2): Has Development Team and Viewers groups
 * - Staging (ws-3): Has Viewers group only
 * - Marketing (ws-4): Has Marketing Team group
 */

export const workspaceRoleBindings: Map<string, RoleBindingBySubject[]> = new Map([
  [
    'redhat/12510751',
    [
      {
        last_modified: '2024-09-01T10:00:00Z',
        subject: {
          id: 'group-1',
          type: 'group',
          group: { name: 'Production Admins', description: 'Administrators for production environment', user_count: 5 },
        },
        roles: [
          { id: 'kessel-role-1', name: 'Workspace Administrator' },
          { id: 'kessel-role-2', name: 'Workspace Viewer' },
        ],
        resource: { id: 'redhat/12510751', type: 'tenant', workspace: { name: 'Organization', type: 'root', description: '' } },
      },
      {
        last_modified: '2024-09-01T10:00:00Z',
        subject: { id: 'group-3', type: 'group', group: { name: 'Viewers', description: 'Read-only access to production', user_count: 25 } },
        roles: [{ id: 'kessel-role-2', name: 'Workspace Viewer' }],
        resource: { id: 'redhat/12510751', type: 'tenant', workspace: { name: 'Organization', type: 'root', description: '' } },
      },
    ],
  ],
  [
    'root-1',
    [
      {
        last_modified: '2024-08-10T08:00:00Z',
        subject: { id: 'group-3', type: 'group', group: { name: 'Viewers', description: 'Read-only access to production', user_count: 25 } },
        roles: [{ id: 'kessel-role-2', name: 'Workspace Viewer' }],
        resource: { id: 'root-1', type: 'workspace', workspace: { name: 'Root Workspace', type: 'root', description: '' } },
      },
    ],
  ],
  ['default-1', []],
  [
    'ws-1',
    [
      {
        last_modified: '2024-08-24T15:45:00Z',
        subject: {
          id: 'group-1',
          type: 'group',
          group: { name: 'Production Admins', description: 'Administrators for production environment', user_count: 5 },
        },
        roles: [
          { id: 'kessel-role-1', name: 'Workspace Administrator' },
          { id: 'kessel-role-2', name: 'Workspace Viewer' },
        ],
        resource: {
          id: 'ws-1',
          type: 'workspace',
          workspace: { name: 'Production', type: 'standard', description: 'Production environment workspace' },
        },
      },
      {
        last_modified: '2024-08-20T10:30:00Z',
        subject: { id: 'group-3', type: 'group', group: { name: 'Viewers', description: 'Read-only access to production', user_count: 25 } },
        roles: [{ id: 'kessel-role-2', name: 'Workspace Viewer' }],
        resource: {
          id: 'ws-1',
          type: 'workspace',
          workspace: { name: 'Production', type: 'standard', description: 'Production environment workspace' },
        },
      },
    ],
  ],
  [
    'ws-2',
    [
      {
        last_modified: '2024-08-22T14:20:00Z',
        subject: { id: 'group-2', type: 'group', group: { name: 'Development Team', description: 'Development environment access', user_count: 12 } },
        roles: [{ id: 'kessel-role-3', name: 'Workspace Editor' }],
        resource: { id: 'ws-2', type: 'workspace', workspace: { name: 'Development', type: 'standard', description: 'Development environment' } },
      },
      {
        last_modified: '2024-08-21T09:15:00Z',
        subject: { id: 'group-3', type: 'group', group: { name: 'Viewers', description: 'Read-only access to production', user_count: 25 } },
        roles: [{ id: 'kessel-role-2', name: 'Workspace Viewer' }],
        resource: { id: 'ws-2', type: 'workspace', workspace: { name: 'Development', type: 'standard', description: 'Development environment' } },
      },
    ],
  ],
  [
    'ws-3',
    [
      {
        last_modified: '2024-08-19T11:45:00Z',
        subject: { id: 'group-3', type: 'group', group: { name: 'Viewers', description: 'Read-only access to production', user_count: 25 } },
        roles: [{ id: 'kessel-role-2', name: 'Workspace Viewer' }],
        resource: { id: 'ws-3', type: 'workspace', workspace: { name: 'Staging', type: 'standard', description: 'Staging environment' } },
      },
    ],
  ],
  [
    'ws-4',
    [
      {
        last_modified: '2024-08-23T16:00:00Z',
        subject: { id: 'group-4', type: 'group', group: { name: 'Marketing Team', description: 'Marketing department access', user_count: 8 } },
        roles: [{ id: 'kessel-role-3', name: 'Workspace Editor' }],
        resource: {
          id: 'ws-4',
          type: 'workspace',
          workspace: { name: 'Marketing', type: 'standard', description: 'Marketing materials and campaigns' },
        },
      },
    ],
  ],
]);

export function getRoleBindingsForWorkspace(workspaceId: string): RoleBindingBySubject[] {
  return workspaceRoleBindings.get(workspaceId) || [];
}

export function getInheritedRoleBindings(workspaceId: string, workspaces: Array<{ id: string; parent_id: string | null }>): RoleBindingBySubject[] {
  const inheritedBindings: RoleBindingBySubject[] = [];

  const getParentChain = (wsId: string): string[] => {
    const workspace = workspaces.find((w) => w.id === wsId);
    if (!workspace || !workspace.parent_id) {
      return [];
    }
    return [workspace.parent_id, ...getParentChain(workspace.parent_id)];
  };

  const parentIds = getParentChain(workspaceId);

  for (const parentId of parentIds) {
    const parentBindings = getRoleBindingsForWorkspace(parentId);
    inheritedBindings.push(...parentBindings);
  }

  return inheritedBindings;
}
