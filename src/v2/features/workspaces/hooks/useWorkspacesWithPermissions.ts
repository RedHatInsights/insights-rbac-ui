import { useMemo } from 'react';
import { type WorkspaceWithPermissions, type WorkspacesListParams, useWorkspacesQuery } from '../../../data/queries/workspaces';
import { type QueryOptions } from '../../../../shared/data/types';
import { useWorkspacePermissions } from './useWorkspacePermissions';

/**
 * Three-phase loading status for workspace data + Kessel permissions.
 *
 * - `'loading'`  — workspace list query is still in-flight (no rows to render)
 * - `'settling'` — workspaces loaded, Kessel permissions still resolving
 *                   (table can render; actions default to deny)
 * - `'ready'`    — everything resolved, actions reflect real grants
 */
export type WorkspacesStatus = 'loading' | 'settling' | 'ready';

/**
 * Composite hook that fetches workspaces and resolves all Kessel permissions
 * (view, edit, delete, create, move) per workspace.
 *
 * Returns `WorkspaceWithPermissions[]` where each workspace has a `permissions`
 * record indicating what the current user can do with it.
 *
 * Combines:
 * - `useWorkspacesQuery` (React Query data fetch)
 * - `useWorkspacePermissions` (single bulk Kessel access check for 5 relations)
 *
 * @param params - Workspace list query parameters
 * @param options - Query options (enabled, queryClient)
 *
 * @example
 * ```tsx
 * const { workspaces, canEditAny, canCreateAny, status } = useWorkspacesWithPermissions();
 *
 * if (status === 'loading') return <Skeleton />;
 * // status is 'settling' or 'ready' — rows are available
 * workspaces.forEach(ws => {
 *   console.log(ws.name, ws.permissions.edit, ws.permissions.create);
 * });
 * ```
 */
export function useWorkspacesWithPermissions(params: WorkspacesListParams = {}, options?: QueryOptions) {
  const workspacesQuery = useWorkspacesQuery(params, options);
  const workspaces = workspacesQuery.data?.data ?? [];

  const {
    permissionsFor,
    hasPermission,
    canEdit,
    canCreateIn,
    canEditAny,
    canCreateAny,
    canMoveAny,
    canDeleteAny,
    isLoading: permissionsLoading,
  } = useWorkspacePermissions(workspaces);

  const workspacesWithPermissions = useMemo<WorkspaceWithPermissions[]>(
    () =>
      workspaces.map((ws) => ({
        ...ws,
        permissions: permissionsFor(ws.id),
      })),
    [workspaces, permissionsFor],
  );

  const status: WorkspacesStatus = workspacesQuery.isLoading ? 'loading' : permissionsLoading ? 'settling' : 'ready';

  return {
    ...workspacesQuery,
    /** Workspaces enriched with per-resource Kessel permissions */
    workspaces: workspacesWithPermissions,
    /** Generic permission check: hasPermission(workspaceId, relation) */
    hasPermission,
    /** Legacy per-id lookups for WorkspaceListTable compat */
    canEdit,
    canCreateIn,
    /** Aggregate flags */
    canEditAny,
    canCreateAny,
    canMoveAny,
    canDeleteAny,
    /** Three-phase loading status: 'loading' → 'settling' → 'ready' */
    status,
  };
}
