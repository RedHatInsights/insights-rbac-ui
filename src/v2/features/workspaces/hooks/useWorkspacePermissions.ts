import { useCallback, useMemo } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { useSelfAccessCheck } from '@project-kessel/react-kessel-access-check';
import { WORKSPACE_RELATIONS, type WorkspacePermissions, type WorkspaceRelation } from '../../../data/queries/workspaces';
import { canCreateInType, canDeleteType, canEditType, canMoveType } from '../workspaceTypes';

type WorkspaceResource = {
  id: string;
  type: 'workspace';
  reporter: { type: string };
};
type NonEmptyResources = [WorkspaceResource, ...WorkspaceResource[]];

const REPORTER = { type: 'rbac' } as const;

/**
 * Dummy resource for the no-workspaces case. Keeps hook calls unconditional
 * (Rules of Hooks compliance); results are ignored when hasRealResources is false.
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
   * @param relation - The Kessel relation to check (view, edit, delete, create, move)
   */
  hasPermission: (workspaceId: string, relation: WorkspaceRelation) => boolean;

  /**
   * Get all resolved permissions for a specific workspace.
   * Returns a WorkspacePermissions record with all 5 relations.
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
 * Checks all 5 core workspace relations (view, edit, delete, create, move)
 * via 5 parallel bulk SDK calls (one per relation, Overload 2). Each call
 * stays within the /checkselfbulk 1000-item limit. Internally finds the
 * root workspace to determine top-level create permission.
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
  // When ON, skip UI type constraints and trust Kessel as the sole authority.
  // When OFF (default), apply defense-in-depth type constraints on top of Kessel results.
  const trustKessel = useFlag('platform.rbac.workspaces.trust-kessel-permissions');

  // Build workspace IDs and find root
  const { workspaceIds, rootId } = useMemo(() => {
    const ids = workspaces.filter((ws) => ws.id).map((ws) => ws.id!);
    const root = workspaces.find((ws) => ws.type === 'root')?.id ?? '';
    return { workspaceIds: ids, rootId: root };
  }, [workspaces]);

  const hasRealResources = workspaceIds.length > 0;

  // Build resources for bulk checks — explicit tuple for type safety.
  // Uses NOOP_RESOURCES when empty to maintain consistent hook call order.
  const resources = useMemo<NonEmptyResources>(() => {
    if (!hasRealResources) return NOOP_RESOURCES;
    const [first, ...rest] = workspaceIds;
    const toResource = (id: string): WorkspaceResource => ({ id, type: 'workspace', reporter: REPORTER });
    return [toResource(first), ...rest.map(toResource)];
  }, [workspaceIds, hasRealResources]);

  // 5 parallel calls (Overload 2: one relation per call, all workspaces).
  // The /checkselfbulk endpoint caps at 1000 items, so consolidating into a
  // single Overload 3 call (N x 5 relations) is not viable at scale.
  const { data: viewChecks, loading: viewLoading } = useSelfAccessCheck({ relation: 'view', resources });
  const { data: editChecks, loading: editLoading } = useSelfAccessCheck({ relation: 'edit', resources });
  const { data: deleteChecks, loading: deleteLoading } = useSelfAccessCheck({ relation: 'delete', resources });
  const { data: createChecks, loading: createLoading } = useSelfAccessCheck({ relation: 'create', resources });
  const { data: moveChecks, loading: moveLoading } = useSelfAccessCheck({ relation: 'move', resources });

  // Build Sets of allowed IDs for O(1) lookups per relation, then apply
  // workspace-type constraints that Kessel doesn't model.
  //
  // Business rules — see https://redhat.atlassian.net/browse/RHCLOUD-39826
  // Defense-in-depth until the backend enforces these:
  //   root            → view only (no edit, create, move, delete)
  //   default         → edit + create allowed, but not move or delete
  //   ungrouped-hosts → view only (no edit, create, move, delete)
  //   standard        → no type constraints
  const allowedIds = useMemo<Record<WorkspaceRelation, Set<string>>>(() => {
    const sets: Record<WorkspaceRelation, Set<string>> = {
      view: buildAllowedSet(viewChecks, hasRealResources),
      edit: buildAllowedSet(editChecks, hasRealResources),
      delete: buildAllowedSet(deleteChecks, hasRealResources),
      create: buildAllowedSet(createChecks, hasRealResources),
      move: buildAllowedSet(moveChecks, hasRealResources),
    };

    if (!trustKessel) {
      for (const ws of workspaces) {
        if (!ws.id) continue;
        if (!canEditType(ws.type)) sets.edit.delete(ws.id);
        if (!canCreateInType(ws.type)) sets.create.delete(ws.id);
        if (!canDeleteType(ws.type)) sets.delete.delete(ws.id);
        if (!canMoveType(ws.type)) sets.move.delete(ws.id);
      }
    }

    return sets;
  }, [viewChecks, editChecks, deleteChecks, createChecks, moveChecks, hasRealResources, workspaces, trustKessel]);

  // Fingerprint of actual permission data — changes only when real permissions change,
  // not when useSelfAccessCheck returns new object references with identical content.
  // This stabilizes all downstream callbacks and prevents infinite re-render loops
  // in consumers that depend on the enriched workspaces array.
  const allowedIdsFingerprint = useMemo(
    () => WORKSPACE_RELATIONS.map((rel) => `${rel}:${[...allowedIds[rel]].sort().join(',')}`).join('|'),
    [allowedIds],
  );

  // Intentional: deps use allowedIdsFingerprint (not allowedIds) for reference stability
  const hasPermission = useCallback(
    (workspaceId: string, relation: WorkspaceRelation): boolean => allowedIds[relation].has(workspaceId),
    [allowedIdsFingerprint],
  );

  // Intentional: deps use allowedIdsFingerprint (not allowedIds) for reference stability
  const permissionsFor = useCallback(
    (workspaceId: string): WorkspacePermissions => ({
      view: allowedIds.view.has(workspaceId),
      edit: allowedIds.edit.has(workspaceId),
      delete: allowedIds.delete.has(workspaceId),
      create: allowedIds.create.has(workspaceId),
      move: allowedIds.move.has(workspaceId),
    }),
    [allowedIdsFingerprint],
  );

  // Intentional: deps use allowedIdsFingerprint (not allowedIds) for reference stability
  const canEdit = useCallback((workspaceId: string): boolean => allowedIds.edit.has(workspaceId), [allowedIdsFingerprint]);
  // Intentional: deps use allowedIdsFingerprint (not allowedIds) for reference stability
  const canCreateIn = useCallback((workspaceId: string): boolean => allowedIds.create.has(workspaceId), [allowedIdsFingerprint]);

  const canEditAny = allowedIds.edit.size > 0;
  const canCreateAny = allowedIds.create.size > 0;
  const canCreateTopLevel = rootId !== '' && allowedIds.create.has(rootId);
  const isLoading = hasRealResources && (viewLoading || editLoading || deleteLoading || createLoading || moveLoading);

  return { hasPermission, permissionsFor, canEdit, canCreateIn, canEditAny, canCreateAny, canCreateTopLevel, isLoading };
}
