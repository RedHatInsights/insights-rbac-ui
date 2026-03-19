import React, { useMemo } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useSelfAccessCheck } from '@project-kessel/react-kessel-access-check';
import type { NotEmptyArray, SelfAccessCheckResourceWithRelation } from '@project-kessel/react-kessel-access-check/types';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import { AppPlaceholder } from '../../shared/components/ui-states/LoaderPlaceholders';
import useIdentity from '../../shared/hooks/useIdentity';
import { useOrganizationData } from '../hooks/useOrganizationData';
import messages from '../../Messages';

// ============================================================================
// Domain permission tokens — mirrors Kessel domain hook return shapes
// ============================================================================

export const roles = {
  canView: 'roles.canView',
  canCreate: 'roles.canCreate',
  canUpdate: 'roles.canUpdate',
  canDelete: 'roles.canDelete',
} as const;

export const groups = {
  canView: 'groups.canView',
  canCreate: 'groups.canCreate',
  canUpdate: 'groups.canUpdate',
  canDelete: 'groups.canDelete',
} as const;

export const workspaces = {
  canView: 'workspaces.canView',
  canCreate: 'workspaces.canCreate',
  canUpdate: 'workspaces.canUpdate',
  canDelete: 'workspaces.canDelete',
  canMove: 'workspaces.canMove',
} as const;

export const principals = {
  canList: 'principals.canList',
} as const;

export type V2Permission =
  | (typeof roles)[keyof typeof roles]
  | (typeof groups)[keyof typeof groups]
  | (typeof workspaces)[keyof typeof workspaces]
  | (typeof principals)[keyof typeof principals];

// ============================================================================
// Internal Kessel mapping — never exported
// ============================================================================

const RBAC_REPORTER = { type: 'rbac' } as const;

type RbacTenantRelation =
  | 'rbac_roles_read'
  | 'rbac_roles_write'
  | 'rbac_groups_read'
  | 'rbac_groups_write'
  | 'rbac_principal_read'
  | 'rbac_workspace_view'
  | 'rbac_workspace_edit'
  | 'rbac_workspace_create'
  | 'rbac_workspace_delete'
  | 'rbac_workspace_move';

const KESSEL_MAP: Record<V2Permission, RbacTenantRelation> = {
  'roles.canView': 'rbac_roles_read',
  'roles.canCreate': 'rbac_roles_write',
  'roles.canUpdate': 'rbac_roles_write',
  'roles.canDelete': 'rbac_roles_write',
  'groups.canView': 'rbac_groups_read',
  'groups.canCreate': 'rbac_groups_write',
  'groups.canUpdate': 'rbac_groups_write',
  'groups.canDelete': 'rbac_groups_write',
  'workspaces.canView': 'rbac_workspace_view',
  'workspaces.canCreate': 'rbac_workspace_create',
  'workspaces.canUpdate': 'rbac_workspace_edit',
  'workspaces.canDelete': 'rbac_workspace_delete',
  'workspaces.canMove': 'rbac_workspace_move',
  'principals.canList': 'rbac_principal_read',
};

// ============================================================================
// V2 Permission Guard component
// ============================================================================

interface V2PermissionGuardProps {
  permissions?: V2Permission[];
  checkAll?: boolean;
  requireOrgAdmin?: boolean;
  children?: React.ReactNode;
}

/**
 * V2 route-level permission guard. Uses Kessel SDK for permission checks
 * and Chrome identity for orgAdmin. No V1 API dependency.
 *
 * Two modes:
 * - **Wrap mode**: pass children directly — renders children on success.
 * - **Layout route mode**: no children — renders `<Outlet />` on success.
 */
export const V2PermissionGuard: React.FC<V2PermissionGuardProps> = ({ permissions = [], checkAll = true, requireOrgAdmin = false, children }) => {
  const intl = useIntl();
  const { orgAdmin, ready: identityReady } = useIdentity();
  const { organizationId, isLoading: orgLoading } = useOrganizationData();
  const parentContext = useOutletContext();

  const hasOrgId = organizationId !== '';
  const resourceId = hasOrgId ? `redhat/${organizationId}` : '';

  const kesselRelations = useMemo(() => [...new Set(permissions.map((p) => KESSEL_MAP[p]))], [permissions]);

  const resources = useMemo<NotEmptyArray<SelfAccessCheckResourceWithRelation>>(() => {
    if (!hasOrgId || kesselRelations.length === 0) {
      return [] as unknown as NotEmptyArray<SelfAccessCheckResourceWithRelation>;
    }
    return kesselRelations.map((rel) => ({
      id: resourceId,
      type: 'tenant' as const,
      reporter: RBAC_REPORTER,
      relation: rel,
    })) as unknown as NotEmptyArray<SelfAccessCheckResourceWithRelation>;
  }, [resourceId, hasOrgId, kesselRelations]);

  const { data, loading: kesselLoading } = useSelfAccessCheck({ resources });

  // No permissions and no orgAdmin requirement = public route
  if (permissions.length === 0 && !requireOrgAdmin) {
    return children ? <>{children}</> : <Outlet context={parentContext} />;
  }

  const needsTenantContext = permissions.length > 0;
  const isLoading = (needsTenantContext && orgLoading) || (needsTenantContext && hasOrgId && kesselLoading) || (requireOrgAdmin && !identityReady);

  if (isLoading) {
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

  if (permissions.length > 0) {
    // Fail closed: if tenant context is missing, deny access
    if (!hasOrgId || !Array.isArray(data)) {
      return unauthorizedPage;
    }

    const results = new Map<string, boolean>();
    for (const check of data) {
      if (check.resource.id === resourceId) {
        results.set(check.relation, check.allowed);
      }
    }

    const hasAccess = checkAll ? kesselRelations.every((rel) => results.get(rel) === true) : kesselRelations.some((rel) => results.get(rel) === true);

    if (!hasAccess) {
      return unauthorizedPage;
    }
  }

  return children ? <>{children}</> : <Outlet context={parentContext} />;
};

// ============================================================================
// Guard helpers for V2 routing
// ============================================================================

/**
 * V2 route guard using Kessel permission tokens.
 *
 * @example
 * <Route {...v2Guard([roles.canView])}>
 * <Route {...v2Guard([principals.canList, groups.canView], { checkAll: false })}>
 */
export const v2Guard = (permissions: V2Permission[], opts?: { checkAll?: boolean }) => ({
  element: <V2PermissionGuard permissions={permissions} {...opts} />,
});

/** Shorthand for orgAdmin-only V2 layout routes. */
export const v2GuardOrgAdmin = () => ({
  element: <V2PermissionGuard requireOrgAdmin />,
});

export default V2PermissionGuard;
