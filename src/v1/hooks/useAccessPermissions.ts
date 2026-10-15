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
 * V1 permission check via Chrome's getUserPermissions API.
 * Calls /api/rbac/v1/access/ under the hood.
 *
 * V1-only — V2 code must use Kessel domain hooks from src/v2/hooks/useRbacAccess.ts.
 */
export const useAccessPermissions = (permissions: string[], options: AccessPermissionsOptions = {}): AccessPermissionsResult => {
  const { checkAll = false } = options;

  const apps = getAppsFromPermissions(permissions);
  const primaryApp = apps.length === 1 ? apps[0] : 'rbac';

  const { hasAccess, isLoading } = usePermissions(primaryApp, permissions, false, checkAll);

  return { hasAccess: hasAccess ?? false, isLoading };
};
