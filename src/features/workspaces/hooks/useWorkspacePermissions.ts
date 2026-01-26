import { useCallback, useMemo } from 'react';
import { useSelfAccessCheck } from '@project-kessel/react-kessel-access-check';

type WorkspaceResource = { id: string; type: 'workspace' };
type NonEmptyResources = [WorkspaceResource, ...WorkspaceResource[]];

/**
 * Noop hook that matches useSelfAccessCheck return shape.
 * Used when there are no workspaces to check, avoiding unnecessary API calls.
 */
function useNoopAccessCheck() {
  return { data: [] as const, loading: false };
}

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

  // Build resources for bulk checks - explicit tuple construction for type safety
  const resources = useMemo<NonEmptyResources | null>(() => {
    if (workspaceIds.length === 0) return null;
    const [first, ...rest] = workspaceIds;
    const toResource = (id: string): WorkspaceResource => ({ id, type: 'workspace' });
    return [toResource(first), ...rest.map(toResource)];
  }, [workspaceIds]);

  // Bulk check 'edit' permission on all workspaces (noop when no workspaces)
  const { data: editChecks, loading: editLoading } = resources ? useSelfAccessCheck({ relation: 'edit', resources }) : useNoopAccessCheck();

  // Bulk check 'create' permission on all workspaces (noop when no workspaces)
  const { data: createChecks, loading: createLoading } = resources ? useSelfAccessCheck({ relation: 'create', resources }) : useNoopAccessCheck();

  // Build Sets of allowed IDs for O(1) lookups
  const editAllowedIds = useMemo(() => {
    if (!Array.isArray(editChecks)) return new Set<string>();
    return new Set(editChecks.filter((c) => c.allowed && c.resource.id).map((c) => c.resource.id));
  }, [editChecks]);

  const createAllowedIds = useMemo(() => {
    if (!Array.isArray(createChecks)) return new Set<string>();
    return new Set(createChecks.filter((c) => c.allowed && c.resource.id).map((c) => c.resource.id));
  }, [createChecks]);

  // Stable function references
  const canEdit = useCallback((workspaceId: string): boolean => editAllowedIds.has(workspaceId), [editAllowedIds]);

  const canCreateIn = useCallback((workspaceId: string): boolean => createAllowedIds.has(workspaceId), [createAllowedIds]);

  const canEditAny = editAllowedIds.size > 0;
  const canCreateTopLevel = rootId !== '' && createAllowedIds.has(rootId);
  const isLoading = resources !== null && (editLoading || createLoading);

  return { canEdit, canCreateIn, canEditAny, canCreateTopLevel, isLoading };
}
