import usePermissions from '@redhat-cloud-services/frontend-components-utilities/RBACHook';

interface AccessPermissionsResult {
  /** Whether user has required permission(s) */
  hasAccess: boolean;
  /** Whether permission check is still loading */
  isLoading: boolean;
}

interface AccessPermissionsOptions {
  /** true = ALL permissions required (AND), false = ANY permission (OR). Default: false */
  checkAll?: boolean;
}

/**
 * Extract unique app names from permission strings.
 * Permission format: app:resource:action (e.g., 'rbac:role:write', 'inventory:groups:read')
 */
const getAppsFromPermissions = (permissions: string[]): string[] => {
  const apps = new Set<string>();
  for (const perm of permissions) {
    const [app] = perm.split(':');
    if (app) apps.add(app);
  }
  return Array.from(apps);
};

/**
 * Check if the current user has the specified permissions.
 * Supports permissions from any app (rbac, inventory, etc.)
 *
 * @param permissions - Array of permission strings (e.g., ['rbac:role:write', 'inventory:groups:read'])
 * @param options - Optional settings
 * @returns hasAccess boolean and isLoading state
 *
 * @example
 * // Check single permission
 * const { hasAccess } = useAccessPermissions(['rbac:role:write']);
 *
 * // Check mixed app permissions
 * const { hasAccess } = useAccessPermissions(['rbac:role:read', 'inventory:groups:write']);
 *
 * // Check ALL permissions (AND)
 * const { hasAccess } = useAccessPermissions(
 *   ['rbac:role:read', 'rbac:role:write'],
 *   { checkAll: true }
 * );
 */
export const useAccessPermissions = (permissions: string[], options: AccessPermissionsOptions = {}): AccessPermissionsResult => {
  const { checkAll = false } = options;

  // Get unique apps from permissions - if single app, use it; otherwise use 'rbac' as primary
  // Note: usePermissions checks against ALL user permissions, the app param is just for caching
  const apps = getAppsFromPermissions(permissions);
  const primaryApp = apps.length === 1 ? apps[0] : 'rbac';

  const { hasAccess, isLoading } = usePermissions(primaryApp, permissions, false, checkAll);

  return { hasAccess: hasAccess ?? false, isLoading };
};
