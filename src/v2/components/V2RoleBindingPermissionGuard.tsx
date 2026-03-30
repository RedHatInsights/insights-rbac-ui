import React from 'react';
import { Outlet, useOutletContext, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import { AppPlaceholder } from '../../shared/components/ui-states/LoaderPlaceholders';
import { useRoleBindingsAccess } from '../hooks/useRbacAccess';
import messages from '../../Messages';

// ============================================================================
// Role Binding relation → hook field mapping
// ============================================================================

type RoleBindingRelation = 'view' | 'grant' | 'revoke';

const RELATION_TO_FIELD: Record<RoleBindingRelation, 'canView' | 'canCreate' | 'canRevoke'> = {
  view: 'canView',
  grant: 'canCreate',
  revoke: 'canRevoke',
};

// ============================================================================
// V2 Role Binding Permission Guard
// ============================================================================

interface V2RoleBindingPermissionGuardProps {
  relation: RoleBindingRelation;
  children?: React.ReactNode;
}

/**
 * Route-level guard for role binding operations on a workspace.
 * Reads `:workspaceId` from route params and checks the corresponding
 * Kessel role binding permission via `useRoleBindingsAccess`.
 *
 * Two modes:
 * - **Wrap mode**: pass children directly — renders children on success.
 * - **Layout route mode**: no children — renders `<Outlet />` on success.
 */
const V2RoleBindingPermissionGuard: React.FC<V2RoleBindingPermissionGuardProps> = ({ relation, children }) => {
  const intl = useIntl();
  const parentContext = useOutletContext();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const rbAccess = useRoleBindingsAccess(workspaceId);

  if (rbAccess.isLoading) {
    return <AppPlaceholder />;
  }

  if (!rbAccess[RELATION_TO_FIELD[relation]]) {
    return (
      <UnauthorizedAccess
        serviceName={intl.formatMessage(messages.unauthorizedAccessServiceName)}
        bodyText={intl.formatMessage(messages.unauthorizedAccessBodyText)}
      />
    );
  }

  return children ? <>{children}</> : <Outlet context={parentContext} />;
};

// ============================================================================
// Guard helper for V2 routing
// ============================================================================

/**
 * V2 role-binding route guard. Uses per-workspace Kessel permission checks
 * for role binding operations (view, grant, revoke).
 *
 * @param relation - The role binding relation to check (BE lingo)
 *
 * @example
 * <Route {...v2RoleBindingGuard('grant')}>
 * <Route {...v2RoleBindingGuard('view')}>
 */
export const v2RoleBindingGuard = (relation: RoleBindingRelation) => ({
  element: <V2RoleBindingPermissionGuard relation={relation} />,
});

export { V2RoleBindingPermissionGuard };
export type { RoleBindingRelation };
export default V2RoleBindingPermissionGuard;
