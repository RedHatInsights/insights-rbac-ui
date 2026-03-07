import React from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useAccessPermissions } from '../hooks/useAccessPermissions';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import { AppPlaceholder } from './ui-states/LoaderPlaceholders';
import useUserData from '../hooks/useUserData';
import messages from '../../Messages';

interface PermissionGuardProps {
  permissions?: string[];
  checkAll?: boolean;
  requireOrgAdmin?: boolean;
  children?: React.ReactNode;
}

/**
 * Route-level permission guard. Used by both V1 and V2 routing.
 *
 * Two modes:
 * - **Wrap mode**: pass children directly — renders children on success.
 * - **Layout route mode**: no children — renders `<Outlet />` on success.
 *   Use as `<Route element={<PermissionGuard permissions={[...]} />}>`.
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({ permissions = [], checkAll = true, requireOrgAdmin = false, children }) => {
  const intl = useIntl();
  const { orgAdmin, ready: orgAdminReady } = useUserData();
  // Forward parent's outlet context so nested routes maintain access to it
  const parentContext = useOutletContext();

  const { hasAccess, isLoading } = useAccessPermissions(permissions.length > 0 ? permissions : ['rbac:*:*'], { checkAll });

  if (permissions.length === 0 && !requireOrgAdmin) {
    return children ? <>{children}</> : <Outlet context={parentContext} />;
  }

  if (isLoading || (requireOrgAdmin && !orgAdminReady)) {
    return <AppPlaceholder />;
  }

  const unauthorizedPage = (
    <UnauthorizedAccess
      serviceName={intl.formatMessage(messages.unauthorizedAccessServiceName)}
      bodyText={intl.formatMessage(messages.unauthorizedAccessBodyText)}
    />
  );

  if (requireOrgAdmin && !orgAdmin) {
    return unauthorizedPage;
  }

  if (permissions.length > 0 && !hasAccess) {
    return unauthorizedPage;
  }

  return children ? <>{children}</> : <Outlet context={parentContext} />;
};

/**
 * Helper for spreading permission guard onto a pathless layout `<Route>`.
 * React Router v6 only allows `<Route>` as children of `<Routes>`,
 * so we return `{ element }` for spreading.
 *
 * @example
 * <Route {...guard(['rbac:role:read'])}>
 *   <Route path="roles" element={<Roles />} />
 * </Route>
 */
export const guard = (permissions: string[], opts?: { checkAll?: boolean; requireOrgAdmin?: boolean }) => ({
  element: <PermissionGuard permissions={permissions} {...opts} />,
});

/** Shorthand for orgAdmin-only layout routes. */
export const guardOrgAdmin = () => guard([], { requireOrgAdmin: true });

export default PermissionGuard;
