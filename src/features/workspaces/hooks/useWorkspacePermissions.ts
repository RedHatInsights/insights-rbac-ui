import { useCallback, useMemo } from 'react';
import { useSelfAccessCheck } from '@project-kessel/react-kessel-access-check';
import { type WorkspacePermissions, type WorkspaceRelation } from '../../../data/queries/workspaces';

type WorkspaceResource = {
  id: string;
  type: 'workspace';
  reporter: { type: string };
};
type NonEmptyResources = [WorkspaceResource, ...WorkspaceResource[]];

/**
 * Reporter configuration for Kessel access checks.
 * The reporter identifies the source system for the resource.
 */
const REPORTER = { type: 'rbac' } as const;

/**
 * Dummy resource used when there are no workspaces to check.
 * This allows us to always call useSelfAccessCheck unconditionally,
 * maintaining consistent hook order (Rules of Hooks compliance).
 */
const NOOP_RESOURCE: WorkspaceResource = { id: '__noop__', type: 'workspace', reporter: REPORTER };
const NOOP_RESOURCES: NonEmptyResources = [NOOP_RESOURCE];

interface Workspace {
  id?: string;
  type?: string;
}

/**
 * Result of the useWorkspacePermissions hook
 */
export interface UseWorkspacePermissionsResult {
  /**
   * Generic permission check for any relation on a specific workspace.
   * @param workspaceId - The workspace ID to check
   * @param relation - The Kessel relation to check (view, edit, delete, create, move, rename)
   */
  hasPermission: (workspaceId: string, relation: WorkspaceRelation) => boolean;

  /**
   * Get all resolved permissions for a specific workspace.
   * Returns a WorkspacePermissions record with all 6 relations.
   * @param workspaceId - The workspace ID
   */
  permissionsFor: (workspaceId: string) => WorkspacePermissions;

  /**
   * Check if user can edit a specific workspace.
   * @param workspaceId - The workspace ID to check
   */
  canEdit: (workspaceId: string) => boolean;

  /**
   * Check if user can create workspaces within a specific parent workspace.
   * @param workspaceId - The parent workspace ID
   */
  canCreateIn: (workspaceId: string) => boolean;

  /**
   * Whether the user can edit at least one workspace.
   */
  canEditAny: boolean;

  /**
   * Whether the user can create workspaces in at least one workspace.
   * This is the permission for the main "Create workspace" toolbar button.
   * The button should be enabled if ANY workspace allows creation.
   */
  canCreateAny: boolean;

  /**
   * Whether the user can create top-level workspaces (under root).
   * @deprecated Use canCreateAny for the toolbar button. This is kept for
   * specific cases where only root-level creation permission matters.
   */
  canCreateTopLevel: boolean;

  /** Whether the permission checks are still loading */
  isLoading: boolean;
}

/**
 * Build a Set of workspace IDs that are allowed for a given relation's check results.
 */
function buildAllowedSet(checks: unknown, hasRealResources: boolean): Set<string> {
  if (!hasRealResources || !Array.isArray(checks)) return new Set<string>();
  return new Set(
    checks
      .filter((c: { allowed: boolean; resource: { id: string } }) => c.allowed && c.resource.id)
      .map((c: { resource: { id: string } }) => c.resource.id),
  );
}

/**
 * Hook to check workspace permissions using Kessel access checks.
 *
 * Checks all 6 core workspace relations (view, edit, delete, create, move, rename)
 * for all workspaces in a single hook. Internally finds the root workspace to
 * determine top-level create permission.
 *
 * @param workspaces - Array of workspace objects (needs id and type)
 * @returns Permission check functions and flags
 *
 * @example
 * ```tsx
 * const { canEdit, canCreateIn, hasPermission, permissionsFor, isLoading } = useWorkspacePermissions(workspaces);
 *
 * // Generic permission check:
 * hasPermission(workspace.id, 'delete')
 *
 * // All permissions for one workspace:
 * const perms = permissionsFor(workspace.id); // { view: true, edit: true, ... }
 *
 * // Legacy convenience:
 * <Button disabled={!canEdit(workspace.id)}>Edit</Button>
 * ```
 */
export function useWorkspacePermissions(workspaces: Workspace[]): UseWorkspacePermissionsResult {
  // Build workspace IDs and find root
  const { workspaceIds, rootId } = useMemo(() => {
    const ids = workspaces.filter((ws) => ws.id).map((ws) => ws.id!);
    const root = workspaces.find((ws) => ws.type === 'root')?.id ?? '';
    return { workspaceIds: ids, rootId: root };
  }, [workspaces]);

  // Derive hasRealResources directly from workspaceIds
  const hasRealResources = workspaceIds.length > 0;

  // Build resources for bulk checks - explicit tuple construction for type safety
  // Uses NOOP_RESOURCES when empty to maintain consistent hook call order (Rules of Hooks)
  const resources = useMemo<NonEmptyResources>(() => {
    if (!hasRealResources) return NOOP_RESOURCES;
    const [first, ...rest] = workspaceIds;
    const toResource = (id: string): WorkspaceResource => ({ id, type: 'workspace', reporter: REPORTER });
    return [toResource(first), ...rest.map(toResource)];
  }, [workspaceIds, hasRealResources]);

  // Always call useSelfAccessCheck unconditionally for all 6 relations (Rules of Hooks compliance)
  // Results are ignored when hasRealResources is false
  const { data: viewChecks, loading: viewLoading } = useSelfAccessCheck({ relation: 'view', resources });
  const { data: editChecks, loading: editLoading } = useSelfAccessCheck({ relation: 'edit', resources });
  const { data: deleteChecks, loading: deleteLoading } = useSelfAccessCheck({ relation: 'delete', resources });
  const { data: createChecks, loading: createLoading } = useSelfAccessCheck({ relation: 'create', resources });
  const { data: moveChecks, loading: moveLoading } = useSelfAccessCheck({ relation: 'move', resources });
  const { data: renameChecks, loading: renameLoading } = useSelfAccessCheck({ relation: 'rename', resources });

  // Build Sets of allowed IDs for O(1) lookups per relation
  const allowedIds = useMemo<Record<WorkspaceRelation, Set<string>>>(
    () => ({
      view: buildAllowedSet(viewChecks, hasRealResources),
      edit: buildAllowedSet(editChecks, hasRealResources),
      delete: buildAllowedSet(deleteChecks, hasRealResources),
      create: buildAllowedSet(createChecks, hasRealResources),
      move: buildAllowedSet(moveChecks, hasRealResources),
      rename: buildAllowedSet(renameChecks, hasRealResources),
    }),
    [viewChecks, editChecks, deleteChecks, createChecks, moveChecks, renameChecks, hasRealResources],
  );

  // Generic permission check
  const hasPermission = useCallback(
    (workspaceId: string, relation: WorkspaceRelation): boolean => allowedIds[relation].has(workspaceId),
    [allowedIds],
  );

  // Get all permissions for a single workspace
  const permissionsFor = useCallback(
    (workspaceId: string): WorkspacePermissions => ({
      view: allowedIds.view.has(workspaceId),
      edit: allowedIds.edit.has(workspaceId),
      delete: allowedIds.delete.has(workspaceId),
      create: allowedIds.create.has(workspaceId),
      move: allowedIds.move.has(workspaceId),
      rename: allowedIds.rename.has(workspaceId),
    }),
    [allowedIds],
  );

  // Legacy convenience aliases
  const canEdit = useCallback((workspaceId: string): boolean => allowedIds.edit.has(workspaceId), [allowedIds]);
  const canCreateIn = useCallback((workspaceId: string): boolean => allowedIds.create.has(workspaceId), [allowedIds]);

  const canEditAny = allowedIds.edit.size > 0;
  const canCreateAny = allowedIds.create.size > 0;
  const canCreateTopLevel = rootId !== '' && allowedIds.create.has(rootId);
  const isLoading = hasRealResources && (viewLoading || editLoading || deleteLoading || createLoading || moveLoading || renameLoading);

  return { hasPermission, permissionsFor, canEdit, canCreateIn, canEditAny, canCreateAny, canCreateTopLevel, isLoading };
}
