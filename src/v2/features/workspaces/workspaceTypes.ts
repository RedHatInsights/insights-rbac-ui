/**
 * Workspace type utilities and re-exports.
 *
 * Uses official types from @redhat-cloud-services/rbac-client - the API's source of truth.
 */
import { WorkspacesWorkspaceTypes } from '../../data/api/workspaces';

// Re-export the official API types
export { WorkspacesWorkspaceTypes, WorkspacesWorkspaceTypesQueryParam } from '../../data/api/workspaces';

/**
 * Check if a workspace is a system/protected workspace (root, default, or ungrouped-hosts).
 * These cannot be deleted or modified in certain ways.
 */
export function isSystemWorkspace(type: string | undefined): boolean {
  return type === WorkspacesWorkspaceTypes.Root || type === WorkspacesWorkspaceTypes.Default || type === WorkspacesWorkspaceTypes.UngroupedHosts;
}

/**
 * Check if a workspace is the organization's root workspace.
 * The API returns `type: 'root'` for the top-level workspace.
 *
 * Note: The API also has a 'default' type which is a different concept -
 * it's used for workspaces that serve as defaults for certain operations,
 * not for the root of the hierarchy.
 */
export function isRootWorkspace(type: string | undefined): boolean {
  return type === WorkspacesWorkspaceTypes.Root;
}

/**
 * Find the root/default workspace for use as default parent.
 * Prefers 'root' type (the actual root), falls back to 'default' type.
 *
 * Why both? The API spec defines both types. In practice, the organization's
 * top-level workspace should be type 'root', but we handle 'default' defensively.
 */
export function findDefaultParentWorkspace<T extends { type?: string }>(workspaces: T[]): T | undefined {
  return workspaces.find((ws) => ws.type === WorkspacesWorkspaceTypes.Root) || workspaces.find((ws) => ws.type === WorkspacesWorkspaceTypes.Default);
}

// ---------------------------------------------------------------------------
// Type-based action constraints (RHCLOUD-39826)
//
// These encode the same business rules that useWorkspacePermissions applies
// on top of Kessel results. They exist here for documentation and for any
// edge case where a component needs the rule without going through the hook.
//
//   root            → view only (no edit, create, move, delete)
//   default         → edit + create allowed, but not move or delete
//   ungrouped-hosts → view only (no edit, create, move, delete)
//   standard        → no type constraints (full CRUD)
// ---------------------------------------------------------------------------

const EDITABLE_TYPES: ReadonlySet<string> = new Set([WorkspacesWorkspaceTypes.Default, WorkspacesWorkspaceTypes.Standard]);
const CREATABLE_IN_TYPES: ReadonlySet<string> = new Set([WorkspacesWorkspaceTypes.Default, WorkspacesWorkspaceTypes.Standard]);
const MOVABLE_TYPES: ReadonlySet<string> = new Set([WorkspacesWorkspaceTypes.Standard]);
const DELETABLE_TYPES: ReadonlySet<string> = new Set([WorkspacesWorkspaceTypes.Standard]);

/** Whether the workspace type allows editing/renaming (default, standard). */
export function canEditType(type: string | undefined): boolean {
  return EDITABLE_TYPES.has(type ?? '');
}

/** Whether the workspace type allows creating children (default, standard). */
export function canCreateInType(type: string | undefined): boolean {
  return CREATABLE_IN_TYPES.has(type ?? '');
}

/** Whether the workspace type allows moving (standard only). */
export function canMoveType(type: string | undefined): boolean {
  return MOVABLE_TYPES.has(type ?? '');
}

/** Whether the workspace type allows deletion (standard only). */
export function canDeleteType(type: string | undefined): boolean {
  return DELETABLE_TYPES.has(type ?? '');
}
