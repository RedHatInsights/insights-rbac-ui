/**
 * Workspaces Redux Selectors
 *
 * Memoized selectors for the workspacesReducer slice.
 * Uses reselect to prevent unnecessary re-renders by caching selector results.
 */

import { createSelector } from 'reselect';
import type { RBACStore } from '../store.d';
import type { Workspace, WorkspacesStore } from './reducer';

// ============================================================================
// Base Selectors - Direct state access (no computation)
// ============================================================================

const selectWorkspacesState = (state: RBACStore): WorkspacesStore => state.workspacesReducer;

// ============================================================================
// Memoized Selectors - Computed values
// ============================================================================

/**
 * Select all workspaces array
 * Used in: Workspace lists, dropdowns, validation
 */
export const selectWorkspaces = createSelector([selectWorkspacesState], (workspacesState): Workspace[] => workspacesState.workspaces || []);

/**
 * Select workspaces loading state
 * Used in: Loading spinners, skeleton states
 */
export const selectIsWorkspacesLoading = createSelector([selectWorkspacesState], (workspacesState): boolean => workspacesState.isLoading || false);

/**
 * Select workspaces error
 * Used in: Error messages, error boundaries
 */
export const selectWorkspacesError = createSelector([selectWorkspacesState], (workspacesState): string => workspacesState.error);

/**
 * Select the currently selected/active workspace
 * Used in: Workspace detail pages, edit modals
 */
export const selectSelectedWorkspace = createSelector(
  [selectWorkspacesState],
  (workspacesState): Workspace | null => workspacesState.selectedWorkspace || null,
);

/**
 * Select entire workspaces state object
 * Used in: Components that need multiple workspace properties
 * Returns: { isLoading, workspaces, error, selectedWorkspace }
 */
export const selectWorkspacesFullState = createSelector(
  [selectWorkspacesState],
  (
    workspacesState,
  ): {
    isLoading: boolean;
    workspaces: Workspace[];
    error: string;
    selectedWorkspace: Workspace | null;
  } => ({
    isLoading: workspacesState.isLoading || false,
    workspaces: workspacesState.workspaces || [],
    error: workspacesState.error,
    selectedWorkspace: workspacesState.selectedWorkspace || null,
  }),
);

/**
 * Select workspaces state for create/edit forms
 * Used in: SetDetails, EditWorkspaceModal, validation schemas
 * Returns: { isLoading, workspaces }
 */
export const selectWorkspacesForForm = createSelector(
  [selectIsWorkspacesLoading, selectWorkspaces],
  (isLoading, workspaces): { isLoading: boolean; workspaces: Workspace[] } => ({
    isLoading,
    workspaces,
  }),
);
