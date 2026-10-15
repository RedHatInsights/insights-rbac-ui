// eslint-disable-next-line no-restricted-imports -- shared wrapper for non-RBAC domains (cost-management, inventory)
import usePermissions from '@redhat-cloud-services/frontend-components-utilities/RBACHook';

interface NonRbacPermissionsResult {
  hasAccess: boolean;
  isLoading: boolean;
}

/**
 * Permission check for non-RBAC domains (cost-management, inventory, etc.)
 * that have no V2/Kessel equivalent.
 *
 * Uses Chrome's getUserPermissions API (V1 /access/ endpoint) which the
 * backend keeps enabled for services not yet onboarded to V2.
 *
 * V2 RBAC permission checks must use Kessel domain hooks — this hook is
 * strictly for domains outside RBAC's scope.
 */
export const useNonRbacPermissions = (permissions: string[]): NonRbacPermissionsResult => {
  const apps = new Set<string>();
  for (const perm of permissions) {
    const [app] = perm.split(':');
    if (app) apps.add(app);
  }
  const primaryApp = apps.size === 1 ? [...apps][0] : 'cost-management';

  const { hasAccess, isLoading } = usePermissions(primaryApp, permissions, false, false);

  return { hasAccess: hasAccess ?? false, isLoading };
};
