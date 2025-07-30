import React from 'react';
import { useIntl } from 'react-intl';
import { ContentHeader } from '@patternfly/react-component-groups';
import { Breadcrumb, BreadcrumbItem, Skeleton } from '@patternfly/react-core';
import { WorkspaceActions } from './WorkspaceActions';
import { Workspace } from '../../../redux/workspaces/reducer';
import messages from '../../../Messages';

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

  return (
    <ContentHeader
      title={isLoading ? <Skeleton width="170px" /> : workspace?.name}
      subtitle={isLoading ? <Skeleton width="250px" /> : workspace?.description}
      actionMenu={workspace ? <WorkspaceActions currentWorkspace={workspace} hasAssets={hasAssets} /> : undefined}
    >
      <div className="pf-v5-u-mt-md">
        <span className="pf-v5-u-font-weight-bold pf-v5-u-mr-sm">{intl.formatMessage(messages.workspacesDetailBreadcrumbTitle)}</span>
        <Breadcrumb>
          {workspaceHierarchy.map((workspaceItem, index) => (
            <BreadcrumbItem
              key={workspaceItem.id}
              to={`/iam/access-management/workspaces/detail/${workspaceItem.id}`}
              isActive={index === workspaceHierarchy.length - 1}
            >
              {workspaceItem.name}
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
      </div>
    </ContentHeader>
  );
};
