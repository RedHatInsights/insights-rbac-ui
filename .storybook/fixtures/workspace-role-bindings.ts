import { RoleBindingBySubject } from '../../src/redux/workspaces/reducer';

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
  // Root/Default workspace - inherited by all children
  [
    'root-1',
    [
      {
        last_modified: '2024-08-10T08:00:00Z',
        subject: {
          id: 'group-3',
          type: 'group',
          group: {
            description: 'Read-only access to production',
            user_count: 25,
          },
        },
        roles: [
          {
            id: 'role-2',
            name: 'Workspace Viewer',
          },
        ],
        resource: {
          id: 'root-1',
          name: 'Viewers',
          type: 'workspace',
          workspace: {
            name: 'Default Workspace',
            type: 'root',
            description: 'Root workspace for the organization',
          },
        },
      },
    ],
  ],
  
  // Production workspace - has admin and viewer groups
  [
    'ws-1',
    [
      {
        last_modified: '2024-08-24T15:45:00Z',
        subject: {
          id: 'group-1',
          type: 'group',
          group: {
            description: 'Administrators for production environment',
            user_count: 5,
          },
        },
        roles: [
          {
            id: 'role-1',
            name: 'Workspace Administrator',
          },
          {
            id: 'role-2',
            name: 'Workspace Viewer',
          },
        ],
        resource: {
          id: 'ws-1',
          type: 'workspace',
          name: 'Production Admins',
          workspace: {
            name: 'Production',
            type: 'standard',
            description: 'Production environment workspace',
          },
        },
      },
      {
        last_modified: '2024-08-20T10:30:00Z',
        subject: {
          id: 'group-3',
          type: 'group',
          group: {
            description: 'Read-only access to production',
            user_count: 25,
          },
        },
        roles: [
          {
            id: 'role-2',
            name: 'Workspace Viewer',
          },
        ],
        resource: {
          id: 'ws-1',
          type: 'workspace',
          name: 'Viewers',
          workspace: {
            name: 'Production',
            type: 'standard',
            description: 'Production environment workspace',
          },
        },
      },
    ],
  ],
  
  // Development workspace - has development team
  [
    'ws-2',
    [
      {
        last_modified: '2024-08-22T14:20:00Z',
        subject: {
          id: 'group-2',
          type: 'group',
          group: {
            description: 'Development environment access',
            user_count: 12,
          },
        },
        roles: [
          {
            id: 'role-3',
            name: 'Workspace Editor',
          },
        ],
        resource: {
          name: 'Development Team',
          id: 'ws-2',
          type: 'workspace',
          workspace: {
            name: 'Development',
            type: 'standard',
            description: 'Development environment',
          },
        },
      },
      {
        last_modified: '2024-08-21T09:15:00Z',
        subject: {
          id: 'group-3',
          type: 'group',
          group: {
            description: 'Read-only access to production',
            user_count: 25,
          },
        },
        roles: [
          {
            id: 'role-2',
            name: 'Workspace Viewer',
          },
        ],
        resource: {
          id: 'ws-2',
          name: 'Viewers',
          type: 'workspace',
          workspace: {
            name: 'Development',
            type: 'standard',
            description: 'Development environment',
          },
        },
      },
    ],
  ],
  
  // Staging workspace - only viewers (minimal permissions)
  [
    'ws-3',
    [
      {
        last_modified: '2024-08-19T11:45:00Z',
        subject: {
          id: 'group-3',
          type: 'group',
          group: {
            description: 'Read-only access to production',
            user_count: 25,
          },
        },
        roles: [
          {
            id: 'role-2',
            name: 'Workspace Viewer',
          },
        ],
        resource: {
          id: 'ws-3',
          type: 'workspace',
          name: 'Viewers',
          workspace: {
            name: 'Staging',
            type: 'standard',
            description: 'Staging environment',
          },
        },
      },
    ],
  ],
  
  // Marketing workspace - has marketing-specific group
  [
    'ws-4',
    [
      {
        last_modified: '2024-08-23T16:00:00Z',
        subject: {
          id: 'group-4',
          type: 'group',
          group: {
            description: 'Marketing department access',
            user_count: 8,
          },
        },
        roles: [
          {
            id: 'role-3',
            name: 'Workspace Editor',
          },
        ],
        resource: {
          id: 'ws-4',
          type: 'workspace',
          name: 'Marketing Team',
          workspace: {
            name: 'Marketing',
            type: 'standard',
            description: 'Marketing materials and campaigns',
          },
        },
      },
    ],
  ],
]);

/**
 * Helper to get role bindings for a specific workspace
 */
export function getRoleBindingsForWorkspace(workspaceId: string): RoleBindingBySubject[] {
  return workspaceRoleBindings.get(workspaceId) || [];
}

/**
 * Helper to get inherited role bindings from parent workspaces
 * 
 * @param workspaceId - Current workspace ID
 * @param workspaces - All workspaces to build hierarchy
 * @returns Role bindings from all parent workspaces
 */
export function getInheritedRoleBindings(
  workspaceId: string,
  workspaces: Array<{ id: string; parent_id: string | null }>
): RoleBindingBySubject[] {
  const inheritedBindings: RoleBindingBySubject[] = [];
  
  // Build parent chain
  const getParentChain = (wsId: string): string[] => {
    const workspace = workspaces.find((w) => w.id === wsId);
    if (!workspace || !workspace.parent_id) {
      return [];
    }
    return [workspace.parent_id, ...getParentChain(workspace.parent_id)];
  };
  
  const parentIds = getParentChain(workspaceId);
  
  // Collect bindings from all parents
  for (const parentId of parentIds) {
    const parentBindings = getRoleBindingsForWorkspace(parentId);
    inheritedBindings.push(...parentBindings);
  }
  
  return inheritedBindings;
}

