/**
 * Workspace type utilities and re-exports.
 *
 * Uses official types from @redhat-cloud-services/rbac-client - the API's source of truth.
 */
import { WorkspacesWorkspaceTypes } from '@redhat-cloud-services/rbac-client/v2/types';

// Re-export the official API types
export { WorkspacesWorkspaceTypes, WorkspacesWorkspaceTypesQueryParam } from '@redhat-cloud-services/rbac-client/v2/types';

/**
 * Check if a workspace is a system/protected workspace (root or default).
 * These cannot be deleted or modified in certain ways.
 */
export function isSystemWorkspace(type: string | undefined): boolean {
  return type === WorkspacesWorkspaceTypes.Root || type === WorkspacesWorkspaceTypes.Default;
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
