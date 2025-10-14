import { useFlag } from '@unleash/proxy-client-react';

/**
 * Workspace Feature Flag Hook
 *
 * Provides a simple API to check if a specific workspace milestone feature set is enabled.
 * Handles the feature flag hierarchy automatically, so you don't need to check multiple flags.
 *
 * @see WORKSPACE_FEATURE_FLAGS.md for complete documentation
 *
 * @example
 * ```tsx
 * // Check if M1 features (workspace list) are available
 * const hasWorkspacesList = useWorkspacesFlag('m1');
 *
 * // Check if M2 features (hierarchy management) are available
 * const hasHierarchyManagement = useWorkspacesFlag('m2');
 *
 * // Check if M3 features (RBAC detail pages) are available
 * const hasRbacDetailPages = useWorkspacesFlag('m3');
 *
 * // Check if M4 features (role bindings write) are available
 * const hasRoleBindingsWrite = useWorkspacesFlag('m4');
 *
 * // Check if M5 (all features) is enabled
 * const hasAllFeatures = useWorkspacesFlag('m5');
 * ```
 *
 * @param milestone - The minimum milestone level to check ('m1' | 'm2' | 'm3' | 'm4' | 'm5')
 * @returns boolean - true if the requested milestone features (or higher) are enabled
 */
export function useWorkspacesFlag(milestone: 'm1' | 'm2' | 'm3' | 'm4' | 'm5'): boolean {
  // Get all feature flags
  const enableWorkspacesList = useFlag('platform.rbac.workspaces-list'); // M1
  const enableHierarchy = useFlag('platform.rbac.workspace-hierarchy'); // M2
  const enableRoleBindings = useFlag('platform.rbac.workspaces-role-bindings'); // M3
  const enableRoleBindingsWrite = useFlag('platform.rbac.workspaces-role-bindings-write'); // M4
  const globalWs = useFlag('platform.rbac.workspaces'); // M5 (master flag)

  // Master flag (M5) enables ALL features
  if (globalWs) {
    return true;
  }

  // Check specific milestone
  switch (milestone) {
    case 'm1':
      // M1: Basic workspace list view
      return enableWorkspacesList;

    case 'm2':
      // M2: Hierarchy management (requires M1)
      // In production, M2 implies M1, so we only check the M2 flag
      return enableHierarchy;

    case 'm3':
      // M3: RBAC detail pages with read-only role bindings (requires M1 + M2)
      // In production, M3 implies M2 and M1, so we only check the M3 flag
      return enableRoleBindings;

    case 'm4':
      // M4: Role bindings write access (requires M1 + M2 + M3)
      // In production, M4 implies M3, M2, and M1, so we only check the M4 flag
      return enableRoleBindingsWrite;

    case 'm5':
      // M5: Master flag (explicitly checking if master flag is enabled)
      return globalWs;

    default:
      // TypeScript should prevent this, but handle it gracefully
      console.error(`Invalid milestone: ${milestone}`);
      return false;
  }
}

/**
 * Alternative hook that returns all milestone feature availability
 * Useful when you need to check multiple milestones in one component
 *
 * @example
 * ```tsx
 * const features = useWorkspacesFeatures();
 *
 * if (features.m3) {
 *   // Show RBAC detail page link
 * } else if (features.m2) {
 *   // Show Inventory link
 * } else if (features.m1) {
 *   // Show plain text
 * }
 * ```
 */
export function useWorkspacesFeatures() {
  const globalWs = useFlag('platform.rbac.workspaces');

  // If master flag is enabled, all features are available
  if (globalWs) {
    return {
      m1: true,
      m2: true,
      m3: true,
      m4: true,
      m5: true,
    };
  }

  // Otherwise, check individual flags
  const enableWorkspacesList = useFlag('platform.rbac.workspaces-list');
  const enableHierarchy = useFlag('platform.rbac.workspace-hierarchy');
  const enableRoleBindings = useFlag('platform.rbac.workspaces-role-bindings');
  const enableRoleBindingsWrite = useFlag('platform.rbac.workspaces-role-bindings-write');

  return {
    m1: enableWorkspacesList,
    m2: enableHierarchy,
    m3: enableRoleBindings,
    m4: enableRoleBindingsWrite,
    m5: globalWs,
  };
}
