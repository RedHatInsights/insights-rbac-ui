import React from 'react';
import { Outlet, useOutletContext, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import { AppPlaceholder } from '../../shared/components/ui-states/LoaderPlaceholders';
import type { WorkspaceRelation, WorkspacesListParams } from '../data/queries/workspaces';
import { useWorkspacesWithPermissions } from '../features/workspaces/hooks/useWorkspacesWithPermissions';
import messages from '../../Messages';

// ============================================================================
// V2 Workspace Permission Guard
// ============================================================================

interface V2WorkspacePermissionGuardProps {
  relation: WorkspaceRelation;
  params?: WorkspacesListParams;
  children?: React.ReactNode;
}

/**
 * Workspace-level route guard. Checks per-workspace Kessel permissions
 * via `useWorkspacesWithPermissions`.
 *
 * - When `:workspaceId` is present in route params, checks that specific workspace.
 * - When absent (e.g. create route), falls back to aggregate flags.
 *   Only `create`, `edit`, and `view` have aggregate handlers; all other
 *   relations default to deny.
 *
 * Optional `params` are forwarded to the workspace query (e.g. filter by type).
 *
 * Two modes:
 * - **Wrap mode**: pass children directly — renders children on success.
 * - **Layout route mode**: no children — renders `<Outlet />` on success.
 */
const V2WorkspacePermissionGuard: React.FC<V2WorkspacePermissionGuardProps> = ({ relation, params, children }) => {
  const intl = useIntl();
  const parentContext = useOutletContext();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces, hasPermission, canCreateAny, canEditAny, canMoveAny, canDeleteAny, status } = useWorkspacesWithPermissions(params);

  if (status !== 'ready') {
    return <AppPlaceholder />;
  }

  const aggregateCheck: Partial<Record<WorkspaceRelation, boolean>> = {
    create: canCreateAny,
    edit: canEditAny,
    move: canMoveAny,
    delete: canDeleteAny,
    view: workspaces.length > 0,
  };

  const hasAccess = workspaceId ? hasPermission(workspaceId, relation) : (aggregateCheck[relation] ?? false);

  if (!hasAccess) {
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
 * V2 workspace-level route guard.
 *
 * Uses per-workspace Kessel permission checks (not tenant-level).
 * Reads `:workspaceId` from route params when available.
 *
 * @param relation - The workspace relation to check (view, edit, create, etc.)
 * @param params - Optional query params forwarded to the workspace list query
 *
 * @example
 * <Route {...v2WorkspaceGuard('view', { type: WorkspacesWorkspaceTypesQueryParam.Standard })}>
 * <Route {...v2WorkspaceGuard('create')}>
 * <Route {...v2WorkspaceGuard('edit')}>
 */
export const v2WorkspaceGuard = (relation: WorkspaceRelation, params?: WorkspacesListParams) => ({
  element: <V2WorkspacePermissionGuard relation={relation} params={params} />,
});

export { V2WorkspacePermissionGuard };
export default V2WorkspacePermissionGuard;
