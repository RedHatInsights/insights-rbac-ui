import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkspace, fetchWorkspaces } from '../../redux/actions/workspaces-actions';
import { ContentHeader } from '@patternfly/react-component-groups';
import { Breadcrumb, BreadcrumbItem, Divider, PageSection, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { RBACStore } from '../../redux/store';
import { useParams } from 'react-router-dom';
import AppTabs from '../app-tabs/app-tabs';
import pathnames from '../../utilities/pathnames';
import WorkspaceActions from './WorkspaceActions';
import Messages from '../../Messages';

interface WorkspaceData {
  name: string;
  id: string;
}

const WorkspaceDetail = () => {
  const intl = useIntl();
  const { workspaceId } = useParams();

  const dispatch = useDispatch();

  const { isLoading, workspaces, selectedWorkspace, error } = useSelector((state: RBACStore) => state.workspacesReducer);
  const [workspaceHierarchy, setWorkspaceHierarchy] = useState<WorkspaceData[]>([]);

  useEffect(() => {
    if (workspaceId && workspaceId.length > 0) {
      dispatch(fetchWorkspace(workspaceId));
    }
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const buildWorkspacesHierarchy = (workspaces: any[], workspaceId: string): WorkspaceData[] => {
    let currentWorkspace = workspaces.find((ws) => ws.id === workspaceId);

    const hierarchy: WorkspaceData[] = currentWorkspace ? [currentWorkspace] : [];
    while (currentWorkspace?.parent_id?.length > 0) {
      currentWorkspace = workspaces.find((ws) => ws.id === currentWorkspace?.parent_id);
      if (!currentWorkspace) break;
      hierarchy.unshift({ name: currentWorkspace.name, id: currentWorkspace.id });
    }

    return hierarchy;
  };

  useEffect(() => {
    if (workspaces.length > 0 && workspaceId) {
      setWorkspaceHierarchy(buildWorkspacesHierarchy(workspaces, workspaceId));
    }
  }, [workspaces]);

  const tabItems = [
    { eventKey: 0, title: 'Role assignments', name: pathnames['workspace-detail'].link, to: '' },
    { eventKey: 1, title: 'Assets', name: pathnames['workspace-detail'].link, to: '' },
    { eventKey: 2, title: 'Features management', name: pathnames['workspace-detail'].link, to: '' },
  ];

  return (
    <React.Fragment>
      <ContentHeader
        title={selectedWorkspace?.name ?? 'Unknown Workspace'}
        subtitle={selectedWorkspace?.description}
        actionMenu={<WorkspaceActions />}
      >
        <div className="pf-v5-u-mt-md">
          <span className="pf-v5-u-font-weight-bold">{intl.formatMessage(Messages.workspacesDetailBreadcrumbTitle)}</span>
          <Breadcrumb>
            {workspaceHierarchy.map((workspace, index) => (
              <BreadcrumbItem
                key={workspace.id}
                to={`/iam/access-management/workspaces/detail/${workspace.id}`}
                isActive={index === workspaceHierarchy.length - 1}
              >
                {workspace.name}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        </div>
      </ContentHeader>
      <Divider />
      <AppTabs isHeader tabItems={tabItems} />
      <PageSection>
        {isLoading && <p>Loading state...</p>}
        {error && <p>Error state: {error}</p>}
        {!isLoading && !error && (
          <TextContent>
            <Text component={TextVariants.p}>Tab content to be placed here</Text>
          </TextContent>
        )}
      </PageSection>
    </React.Fragment>
  );
};

export default WorkspaceDetail;
