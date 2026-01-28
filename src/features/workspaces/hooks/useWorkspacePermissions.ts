import { useCallback, useMemo } from 'react';
import { useSelfAccessCheck } from '@project-kessel/react-kessel-access-check';

type WorkspaceResource = { id: string; type: 'workspace' };
type NonEmptyResources = [WorkspaceResource, ...WorkspaceResource[]];

/**
 * Dummy resource used when there are no workspaces to check.
 * This allows us to always call useSelfAccessCheck unconditionally,
 * maintaining consistent hook order (Rules of Hooks compliance).
 */
const NOOP_RESOURCE: WorkspaceResource = { id: '__noop__', type: 'workspace' };
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
   * Whether the user can create top-level workspaces (under root).
   * This is the permission for the main "Create workspace" button.
   */
  canCreateTopLevel: boolean;

  /** Whether the permission checks are still loading */
  isLoading: boolean;
}

/**
 * Hook to check workspace permissions using Kessel access checks.
 *
 * Checks both 'edit' and 'create' permissions for all workspaces in a single hook.
 * Internally finds the root workspace to determine top-level create permission.
 *
 * @param workspaces - Array of workspace objects (needs id and type)
 * @returns Permission check functions and flags
 *
 * @example
 * ```tsx
 * const { canEdit, canCreateIn, canEditAny, canCreateTopLevel, isLoading } = useWorkspacePermissions(workspaces);
 *
 * // Top-level create button:
 * <Button disabled={!canCreateTopLevel}>Create Workspace</Button>
 *
 * // Row-level actions:
 * <Button disabled={!canEdit(workspace.id)}>Edit</Button>
 * <Button disabled={!canCreateIn(workspace.id)}>Create Subworkspace</Button>
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
    const toResource = (id: string): WorkspaceResource => ({ id, type: 'workspace' });
    return [toResource(first), ...rest.map(toResource)];
  }, [workspaceIds, hasRealResources]);

  // Always call useSelfAccessCheck unconditionally (Rules of Hooks compliance)
  // Results are ignored when hasRealResources is false
  const { data: editChecks, loading: editLoading } = useSelfAccessCheck({ relation: 'edit', resources });
  const { data: createChecks, loading: createLoading } = useSelfAccessCheck({ relation: 'create', resources });

  // Build Sets of allowed IDs for O(1) lookups
  // No need to filter NOOP_RESOURCE - we guard with hasRealResources
  const editAllowedIds = useMemo(() => {
    if (!hasRealResources || !Array.isArray(editChecks)) return new Set<string>();
    return new Set(editChecks.filter((c) => c.allowed && c.resource.id).map((c) => c.resource.id));
  }, [editChecks, hasRealResources]);

  const createAllowedIds = useMemo(() => {
    if (!hasRealResources || !Array.isArray(createChecks)) return new Set<string>();
    return new Set(createChecks.filter((c) => c.allowed && c.resource.id).map((c) => c.resource.id));
  }, [createChecks, hasRealResources]);

  // Stable function references
  const canEdit = useCallback((workspaceId: string): boolean => editAllowedIds.has(workspaceId), [editAllowedIds]);

  const canCreateIn = useCallback((workspaceId: string): boolean => createAllowedIds.has(workspaceId), [createAllowedIds]);

  const canEditAny = editAllowedIds.size > 0;
  const canCreateTopLevel = rootId !== '' && createAllowedIds.has(rootId);
  const isLoading = hasRealResources && (editLoading || createLoading);

  return { canEdit, canCreateIn, canEditAny, canCreateTopLevel, isLoading };
}
