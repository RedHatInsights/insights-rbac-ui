import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import { useAccessPermissions } from '../hooks/useAccessPermissions';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import { AppPlaceholder } from './ui-states/LoaderPlaceholders';
import PermissionsContext from '../utilities/permissionsContext';
import messages from '../Messages';

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
  const intl = useIntl();
  const { orgAdmin } = useContext(PermissionsContext);

  // Always call the hook with a dummy permission for public routes to keep hook order consistent
  // (React requires hooks to be called in the same order on every render)
  const { hasAccess, isLoading } = useAccessPermissions(permissions.length > 0 ? permissions : ['rbac:*:*'], { checkAll });

  // Empty permissions array and no orgAdmin requirement = public route (skip permission check)
  if (permissions.length === 0 && !requireOrgAdmin) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <AppPlaceholder />;
  }

  const unauthorizedPage = (
    <UnauthorizedAccess
      serviceName={intl.formatMessage(messages.unauthorizedAccessServiceName)}
      bodyText={intl.formatMessage(messages.unauthorizedAccessBodyText)}
    />
  );

  // Check orgAdmin requirement
  if (requireOrgAdmin && !orgAdmin) {
    return unauthorizedPage;
  }

  // Check granular permissions (only if permissions array is not empty)
  if (permissions.length > 0 && !hasAccess) {
    return unauthorizedPage;
  }

  return <>{children}</>;
};

export default PermissionGuard;
