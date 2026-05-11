import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@patternfly/react-component-groups';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Breadcrumb } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { BreadcrumbItem } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { Skeleton } from '@patternfly/react-core/dist/dynamic/components/Skeleton';
import { WorkspaceActions } from './WorkspaceActions';
import { type WorkspaceActionCallbacks, useWorkspaceActionItems } from './useWorkspaceActionItems';
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
  workspace: WorkspacesWorkspace | null;
  isLoading: boolean;
  workspaceHierarchy: WorkspaceHierarchyItem[];
  permissions?: WorkspacePermissions;
  actionCallbacks: WorkspaceActionCallbacks;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ workspace, isLoading, workspaceHierarchy, permissions, actionCallbacks }) => {
  const intl = useIntl();
  const [searchParams] = useSearchParams();

  const fromChildId = searchParams.get('fromChildId');
  const fromChildName = searchParams.get('fromChildName');
  const showChildContextAlert = fromChildId && fromChildName;

  const actionItems = useWorkspaceActionItems({
    workspaceId: workspace?.id,
    permissions,
    callbacks: actionCallbacks,
  });

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
        actionMenu={workspace ? <WorkspaceActions items={actionItems} /> : undefined}
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
