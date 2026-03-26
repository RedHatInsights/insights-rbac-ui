import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@patternfly/react-component-groups';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Breadcrumb } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { BreadcrumbItem } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { Skeleton } from '@patternfly/react-core/dist/dynamic/components/Skeleton';
import { WorkspaceActions } from './WorkspaceActions';
import { type WorkspacePermissions, type WorkspacesWorkspace } from '../../../data/queries/workspaces';
import messages from '../../../../Messages';
import { RbacBreadcrumbs } from '../../../../shared/components/navigation/Breadcrumbs';
import { AppLink } from '../../../../shared/components/navigation/AppLink';
import pathnames from '../../../utilities/pathnames';

export interface WorkspaceHierarchyItem {
  name: string;
  id: string;
  canView: boolean;
}

export interface WorkspaceHeaderProps {
  /** The current workspace being displayed */
  workspace: WorkspacesWorkspace | null;
  /** Whether workspace data is loading */
  isLoading: boolean;
  /** Array of workspaces representing the hierarchy path (from root to current) */
  workspaceHierarchy: WorkspaceHierarchyItem[];
  /** Whether the workspace has child assets/workspaces */
  hasAssets: boolean;
  /** Per-workspace Kessel permissions forwarded to WorkspaceActions */
  permissions?: WorkspacePermissions;
  /** All workspaces, forwarded to WorkspaceActions for the move dialog */
  allWorkspaces?: WorkspacesWorkspace[];
  /** Callback fired when "Grant access" is selected from the workspace actions menu */
  onGrantAccess?: () => void;
  /** Callback fired when delete is confirmed in WorkspaceActions */
  onDelete?: (workspace: WorkspacesWorkspace) => void;
  /** Callback fired when move is confirmed in WorkspaceActions */
  onMove?: (workspace: WorkspacesWorkspace, targetParentId: string) => void;
}

/**
 * WorkspaceHeader - Presentational component for workspace detail header
 *
 * Displays workspace title, description, breadcrumb hierarchy, and action menu.
 * Handles loading states with skeleton components.
 */
export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  workspace,
  isLoading,
  workspaceHierarchy,
  hasAssets,
  permissions,
  allWorkspaces,
  onGrantAccess,
  onDelete,
  onMove,
}) => {
  const intl = useIntl();
  const [searchParams] = useSearchParams();

  const fromChildId = searchParams.get('fromChildId');
  const fromChildName = searchParams.get('fromChildName');
  const showChildContextAlert = fromChildId && fromChildName;

  const pageBreadcrumbs = useMemo(
    () => [
      { title: intl.formatMessage(messages.workspaces), to: pathnames['access-management-workspaces'].link() },
      { title: workspace?.name, isActive: true },
    ],
    [workspace?.name, intl],
  );

  return (
    <>
      <PageHeader
        data-codemods
        title={isLoading ? <Skeleton width="170px" /> : workspace?.name}
        subtitle={isLoading ? <Skeleton width="250px" /> : workspace?.description}
        breadcrumbs={isLoading ? undefined : <RbacBreadcrumbs breadcrumbs={pageBreadcrumbs} />}
        actionMenu={
          workspace ? (
            <WorkspaceActions
              currentWorkspace={workspace}
              hasAssets={hasAssets}
              permissions={permissions}
              allWorkspaces={allWorkspaces}
              onGrantAccess={onGrantAccess}
              onDelete={onDelete}
              onMove={onMove}
            />
          ) : undefined
        }
      >
        <div className="pf-v6-u-mt-md">
          <span className="pf-v6-u-font-weight-bold pf-v6-u-mr-sm">{intl.formatMessage(messages.workspacesDetailBreadcrumbTitle)}</span>
          <Breadcrumb>
            {workspaceHierarchy.map((workspaceItem, index) => {
              const isActive = index === workspaceHierarchy.length - 1;
              return (
                <BreadcrumbItem key={workspaceItem.id} isActive={isActive}>
                  {isActive ? (
                    workspaceItem.name
                  ) : workspaceItem.canView ? (
                    <AppLink to={pathnames['workspace-detail'].link(workspaceItem.id)}>{workspaceItem.name}</AppLink>
                  ) : (
                    workspaceItem.name
                  )}
                </BreadcrumbItem>
              );
            })}
          </Breadcrumb>
        </div>
      </PageHeader>
      {showChildContextAlert && (
        <Alert
          variant="info"
          isInline
          title={intl.formatMessage(messages.workspaceInheritedFromChildAlert, {
            childWorkspaceName: decodeURIComponent(fromChildName),
            parentWorkspaceName: workspace?.name || '',
          })}
          className="pf-v6-u-mt-md"
          role="alert"
        />
      )}
    </>
  );
};
