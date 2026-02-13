import { useMemo } from 'react';
import { type WorkspaceWithPermissions, type WorkspacesListParams, useWorkspacesQuery } from '../../../data/queries/workspaces';
import { type QueryOptions } from '../../../data/queries/types';
import { useWorkspacePermissions } from './useWorkspacePermissions';

/**
 * Composite hook that fetches workspaces and resolves all Kessel permissions
 * (view, edit, delete, create, move, rename) per workspace.
 *
 * Returns `WorkspaceWithPermissions[]` where each workspace has a `permissions`
 * record indicating what the current user can do with it.
 *
 * Combines:
 * - `useWorkspacesQuery` (React Query data fetch)
 * - `useWorkspacePermissions` (Kessel access checks for 6 relations)
 *
 * @param params - Workspace list query parameters
 * @param options - Query options (enabled, queryClient)
 *
 * @example
 * ```tsx
 * const { workspaces, canEditAny, canCreateAny, isLoading } = useWorkspacesWithPermissions();
 *
 * // Each workspace has permissions baked in:
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
    /** Combined loading state (data + permissions) */
    isLoading: workspacesQuery.isLoading || permissionsLoading,
  };
}
