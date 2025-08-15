import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkspace, fetchWorkspaces } from '../../../redux/actions/workspaces-actions';
import { ContentHeader } from '@patternfly/react-component-groups';
import { Breadcrumb, BreadcrumbItem, Divider, PageSection, Skeleton, Tab, Tabs } from '@patternfly/react-core';
import { RBACStore } from '../../../redux/store';
import { useParams, useSearchParams } from 'react-router-dom';
import WorkspaceActions from '../WorkspaceActions';
import messages from '../../../Messages';
import AssetsCards from '../../../presentational-components/shared/AssetsCards';
import RoleAssignmentsTable from './RoleAssignmentsTable';
import { useFlag } from '@unleash/proxy-client-react';
import { Workspace } from '../../../redux/reducers/workspaces-reducer';

interface WorkspaceData {
  name: string;
  id: string;
}

const WORKSPACE_TABS = {
  roles: 0,
  assets: 1,
} as const;

const WorkspaceDetail = () => {
  const intl = useIntl();
  const { workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const enableRoles = useFlag('platform.rbac.workspaces-role-bindings');
  const activeTabString = searchParams.get('activeTab') || (enableRoles ? 'roles' : 'assets');

  const rolesRef = React.createRef<HTMLElement>();
  const assetsRef = React.createRef<HTMLElement>();

  const dispatch = useDispatch();
  const { isLoading, workspaces, selectedWorkspace } = useSelector((state: RBACStore) => state.workspacesReducer);
  const [workspaceHierarchy, setWorkspaceHierarchy] = useState<WorkspaceData[]>([]);

  useEffect(() => {
    if (!searchParams.has('activeTab') || (!enableRoles && activeTabString !== 'assets')) {
      setSearchParams({ activeTab: 'assets' });
    }
  }, [searchParams, setSearchParams, enableRoles, activeTabString]);

  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchWorkspace(workspaceId));
    }
    dispatch(fetchWorkspaces());
  }, [workspaceId]);

  useEffect(() => {
    if (workspaces.length > 0 && workspaceId) {
      setWorkspaceHierarchy(buildWorkspacesHierarchy(workspaces, workspaceId));
    }
  }, [workspaces, workspaceId]);

  const buildWorkspacesHierarchy = (workspaces: Workspace[], workspaceId: string): WorkspaceData[] => {
    let currentWorkspace = workspaces.find((ws) => ws.id === workspaceId);

    const hierarchy: WorkspaceData[] = currentWorkspace ? [currentWorkspace] : [];
    while (currentWorkspace?.parent_id?.length && currentWorkspace?.parent_id?.length > 0) {
      currentWorkspace = workspaces.find((ws) => ws.id === currentWorkspace?.parent_id);
      if (!currentWorkspace) break;
      hierarchy.unshift({ name: currentWorkspace.name, id: currentWorkspace.id });
    }
    return hierarchy;
  };

  const hasAssets = useMemo(() => {
    return workspaces.filter((ws) => ws.parent_id === workspaceId).length > 0 ? true : false;
  }, [selectedWorkspace, workspaces, workspaceId]);

  const handleTabSelect = (_: React.MouseEvent<HTMLElement, MouseEvent>, key: string | number) => {
    const selectedTabKey = Object.keys(WORKSPACE_TABS).find(
      (tab): tab is keyof typeof WORKSPACE_TABS => WORKSPACE_TABS[tab as keyof typeof WORKSPACE_TABS] === key,
    );
    if (selectedTabKey && selectedTabKey !== activeTabString) {
      setSearchParams({ activeTab: selectedTabKey });
    }
  };

  return (
    <>
      <ContentHeader
        title={isLoading ? <Skeleton width="170px" /> : selectedWorkspace?.name}
        subtitle={isLoading ? <Skeleton width="250px" /> : selectedWorkspace?.description}
        actionMenu={<WorkspaceActions currentWorkspace={selectedWorkspace} hasAssets={hasAssets} />}
      >
        <div className="pf-v5-u-mt-md">
          <span className="pf-v5-u-font-weight-bold pf-v5-u-mr-sm">{intl.formatMessage(messages.workspacesDetailBreadcrumbTitle)}</span>
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
      <Tabs
        className="pf-v5-u-background-color-100"
        activeKey={WORKSPACE_TABS[activeTabString as keyof typeof WORKSPACE_TABS]}
        onSelect={handleTabSelect}
        inset={{ default: 'insetNone', md: 'insetSm', xl: 'insetLg' }}
        role="region"
      >
        {enableRoles && (
          <Tab
            eventKey={WORKSPACE_TABS.roles}
            title={intl.formatMessage(messages.roleAssignments)}
            tabContentId="rolesTab"
            tabContentRef={rolesRef}
            ouiaId="roles-tab-button"
          />
        )}
        <Tab
          eventKey={WORKSPACE_TABS.assets}
          title={intl.formatMessage(messages.assets)}
          tabContentId="assetsTab"
          tabContentRef={assetsRef}
          ouiaId="assets-tab-button"
        />
      </Tabs>
      <PageSection>
        {activeTabString === 'assets' ? <AssetsCards workspaceName={selectedWorkspace?.name} /> : enableRoles && <RoleAssignmentsTable />}
      </PageSection>
    </>
  );
};

export default WorkspaceDetail;
