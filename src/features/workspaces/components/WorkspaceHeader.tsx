import React from 'react';
import { useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import { ContentHeader } from '@patternfly/react-component-groups';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Breadcrumb } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { BreadcrumbItem } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { Skeleton } from '@patternfly/react-core/dist/dynamic/components/Skeleton';
import { WorkspaceActions } from './WorkspaceActions';
import { Workspace } from '../../../redux/workspaces/reducer';
import messages from '../../../Messages';
import { AppLink } from '../../../components/navigation/AppLink';
import pathnames from '../../../utilities/pathnames';

interface WorkspaceData {
  name: string;
  id: string;
}

export interface WorkspaceHeaderProps {
  /** The current workspace being displayed */
  workspace: Workspace | null;
  /** Whether workspace data is loading */
  isLoading: boolean;
  /** Array of workspaces representing the hierarchy path (from root to current) */
  workspaceHierarchy: WorkspaceData[];
  /** Whether the workspace has child assets/workspaces */
  hasAssets: boolean;
}

/**
 * WorkspaceHeader - Presentational component for workspace detail header
 *
 * Displays workspace title, description, breadcrumb hierarchy, and action menu.
 * Handles loading states with skeleton components.
 */
export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ workspace, isLoading, workspaceHierarchy, hasAssets }) => {
  const intl = useIntl();
  const [searchParams] = useSearchParams();

  // Check if navigated from a child workspace
  const fromChildId = searchParams.get('fromChildId');
  const fromChildName = searchParams.get('fromChildName');
  const showChildContextAlert = fromChildId && fromChildName;

  return (
    <>
      <ContentHeader
        title={isLoading ? <Skeleton width="170px" /> : workspace?.name}
        subtitle={isLoading ? <Skeleton width="250px" /> : workspace?.description}
        actionMenu={workspace ? <WorkspaceActions currentWorkspace={workspace} hasAssets={hasAssets} /> : undefined}
      >
        <div className="pf-v5-u-mt-md">
          <span className="pf-v5-u-font-weight-bold pf-v5-u-mr-sm">{intl.formatMessage(messages.workspacesDetailBreadcrumbTitle)}</span>
          <Breadcrumb>
            {workspaceHierarchy.map((workspaceItem, index) => {
              const isActive = index === workspaceHierarchy.length - 1;
              return (
                <BreadcrumbItem key={workspaceItem.id} isActive={isActive}>
                  {isActive ? (
                    workspaceItem.name
                  ) : (
                    <AppLink to={pathnames['workspace-detail'].path.replace(':workspaceId', workspaceItem.id)}>{workspaceItem.name}</AppLink>
                  )}
                </BreadcrumbItem>
              );
            })}
          </Breadcrumb>
        </div>
      </ContentHeader>
      {showChildContextAlert && (
        <Alert
          variant="info"
          isInline
          title={intl.formatMessage(messages.workspaceInheritedFromChildAlert, {
            childWorkspaceName: decodeURIComponent(fromChildName),
            parentWorkspaceName: workspace?.name || '',
          })}
          className="pf-v5-u-mt-md"
          role="alert"
        />
      )}
    </>
  );
};
