import React, { useContext } from 'react';
import usePermissions from '@redhat-cloud-services/frontend-components-utilities/RBACHook';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import { AppPlaceholder } from './ui-states/LoaderPlaceholders';
import PermissionsContext from '../utilities/permissionsContext';

interface PermissionGuardProps {
  permissions: string[];
  checkAll?: boolean; // default: true (AND logic)
  requireOrgAdmin?: boolean; // default: false - if true, requires orgAdmin flag
  children: React.ReactNode;
}

/**
 * Route-level permission guard component.
 *
 * Checks if the current user has the required permissions to access a route.
 * - Empty permissions array = public route (no check needed)
 * - checkAll=true (default) = user must have ALL permissions (AND logic)
 * - checkAll=false = user must have ANY permission (OR logic)
 * - requireOrgAdmin=true = additionally requires the orgAdmin platform flag
 *
 * Shows loading placeholder while permissions are being checked,
 * and UnauthorizedAccess component if user lacks required permissions.
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({ permissions, checkAll = true, requireOrgAdmin = false, children }) => {
  const { orgAdmin } = useContext(PermissionsContext);

  // Always call the hook to follow Rules of Hooks
  // When permissions array is empty, pass a dummy to avoid unnecessary API calls
  const { hasAccess, isLoading } = usePermissions('rbac', permissions.length > 0 ? permissions : ['rbac:*:*'], false, checkAll);

  // Empty permissions array and no orgAdmin requirement = public route (skip permission check)
  if (permissions.length === 0 && !requireOrgAdmin) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <AppPlaceholder />;
  }

  // Check orgAdmin requirement
  if (requireOrgAdmin && !orgAdmin) {
    return <UnauthorizedAccess serviceName="User Access" bodyText="You don't have permission to view this page." />;
  }

  // Check granular permissions (only if permissions array is not empty)
  if (permissions.length > 0 && !hasAccess) {
    return <UnauthorizedAccess serviceName="User Access" bodyText="You don't have permission to view this page." />;
  }

  return <>{children}</>;
};

export default PermissionGuard;
