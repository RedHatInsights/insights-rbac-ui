// TypeScript interfaces for Workspace UI components
//
// This file follows the same pattern as features/groups/types.ts:
// - Import and re-export core interfaces from data layer
// - Define feature-specific UI types locally

import type { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';

// ============================================================================
// Re-export from data layer (API types)
// ============================================================================

export type {
  WorkspacesWorkspace,
  WorkspacesWorkspaceListResponse,
  WorkspacesListParams,
  WorkspacesPatchParams,
  RoleBindingsListBySubjectParams,
  RoleBindingsRoleBindingBySubject,
  RoleBindingsRoleBindingBySubjectListResponse,
  RoleBindingsRole,
  RoleBindingsRoleBindingBySubjectSubject,
  RoleBindingsResource,
} from '../../data/queries/workspaces';

// Re-export the isWorkspace type guard from data layer
export { isWorkspace } from '../../data/queries/workspaces';

// ============================================================================
// UI-specific types
// ============================================================================
//
// For workspace type utilities (isSystemWorkspace, isRootWorkspace, etc.),
// import directly from './workspaceTypes'

import type { WorkspacesWorkspace } from '../../data/queries/workspaces';

/**
 * Workspace with children for tree view rendering.
 * Used by WorkspaceListTable for hierarchical display.
 */
export interface WorkspaceWithChildren extends WorkspacesWorkspace {
  children?: WorkspaceWithChildren[];
}

/**
 * Extends PatternFly TreeViewDataItem with workspace data.
 * Used by ManagedSelector and tree view components.
 */
export interface TreeViewWorkspaceItem extends TreeViewDataItem {
  parentTreeViewItem?: TreeViewWorkspaceItem;
  workspace: {
    id: string;
    name: string;
    description?: string;
    type: string;
    parent_id?: string;
  };
}

/**
 * Filter state for workspace list filtering.
 */
export interface WorkspaceFilters {
  name: string;
}

/**
 * Outlet context for workspace routes.
 */
export interface WorkspaceOutletContext {
  workspaceId?: string;
  [key: string]: unknown;
}
