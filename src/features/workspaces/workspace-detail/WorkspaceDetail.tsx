import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkspace, fetchWorkspaces } from '../../../redux/workspaces/actions';
import { fetchGroups } from '../../../redux/groups/actions';
import { Divider, PageSection, Tab, Tabs } from '@patternfly/react-core';
import { RBACStore } from '../../../redux/store';
import { useParams, useSearchParams } from 'react-router-dom';
import messages from '../../../Messages';
import AssetsCards from './components/AssetsCards';
import { RoleAssignmentsTable } from './components/RoleAssignmentsTable';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { useFlag } from '@unleash/proxy-client-react';
import { Workspace } from '../../../redux/workspaces/reducer';
import { mappedProps } from '../../../helpers/dataUtilities';
import { ListGroupsOrderByEnum } from '@redhat-cloud-services/rbac-client/ListGroups';

interface WorkspaceData {
  name: string;
  id: string;
}

const WORKSPACE_TABS = {
  roles: 0,
  assets: 1,
} as const;

const ROLE_ASSIGNMENT_TABS = {
  'roles-assigned-in-workspace': 0,
  'roles-assigned-outside': 1,
} as const;

export const WorkspaceDetail = () => {
  const intl = useIntl();
  const { workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const enableRoles = useFlag('platform.rbac.workspaces-role-bindings');
  const activeTabString = searchParams.get('activeTab') || (enableRoles ? 'roles' : 'assets');
  const activeRoleAssignmentTabString = searchParams.get('roleAssignmentTab') || 'roles-assigned-in-workspace';

  const rolesRef = React.createRef<HTMLElement>();
  const assetsRef = React.createRef<HTMLElement>();

  const dispatch = useDispatch();
  const { isLoading, workspaces, selectedWorkspace } = useSelector((state: RBACStore) => state.workspacesReducer);

  // Groups data for RoleAssignmentsTable
  const groups = useSelector((state: RBACStore) => state.groupReducer?.groups?.data || []);
  const groupsTotalCount = useSelector((state: RBACStore) => state.groupReducer?.groups?.meta.count || 0);
  const groupsIsLoading = useSelector((state: RBACStore) => state.groupReducer?.isLoading);

  const [workspaceHierarchy, setWorkspaceHierarchy] = useState<WorkspaceData[]>([]);

  // Groups pagination state
  const [groupsPage, setGroupsPage] = useState(1);
  const [groupsPerPage, setGroupsPerPage] = useState(20);

  // Groups sorting and filtering state
  const [groupsSortBy, setGroupsSortBy] = useState('name');
  const [groupsDirection, setGroupsDirection] = useState<'asc' | 'desc'>('asc');
  const [groupsFilters, setGroupsFilters] = useState<{ name: string }>({ name: '' });

  // Groups data fetching
  const fetchGroupsData = useCallback(
    (page: number, perPage: number, sortBy?: string, direction?: 'asc' | 'desc', filters?: { name: string }) => {
      const offset = (page - 1) * perPage;
      const orderBy = sortBy && direction ? `${direction === 'desc' ? '-' : ''}${sortBy}` : 'name';
      const nameFilter = filters?.name?.trim() || '';

      dispatch(
        fetchGroups({
          ...mappedProps({
            count: groupsTotalCount || 0,
            limit: perPage,
            offset,
            orderBy: orderBy as ListGroupsOrderByEnum,
          }),
          // Pass filter parameters correctly according to the API
          ...(nameFilter
            ? {
                filters: { name: nameFilter },
                nameMatch: 'partial' as const, // Enable partial matching for the filter
              }
            : {}),
          usesMetaInURL: true,
          system: false,
        }),
      );
    },
    [dispatch, groupsTotalCount],
  );

  useEffect(() => {
    if (activeTabString === 'roles' && enableRoles) {
      fetchGroupsData(groupsPage, groupsPerPage, groupsSortBy, groupsDirection, groupsFilters);
    }
  }, [fetchGroupsData, groupsPage, groupsPerPage, groupsSortBy, groupsDirection, groupsFilters, activeTabString, enableRoles]);

  const handleGroupsPaginationChange = useCallback((page: number, perPage: number) => {
    setGroupsPage(page);
    setGroupsPerPage(perPage);
  }, []);

  const handleGroupsSort = useCallback((_event: React.MouseEvent | React.KeyboardEvent, key: string, direction: 'asc' | 'desc') => {
    setGroupsSortBy(key);
    setGroupsDirection(direction);
    setGroupsPage(1); // Reset to first page when sorting
  }, []);

  const handleGroupsSetFilters = useCallback((newFilters: Partial<{ name: string }>) => {
    setGroupsFilters((prev) => ({ ...prev, ...newFilters }));
    setGroupsPage(1); // Reset to first page when filtering
  }, []);

  const handleGroupsClearAllFilters = useCallback(() => {
    setGroupsFilters({ name: '' });
    setGroupsPage(1); // Reset to first page when clearing filters
  }, []);

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

  const handleRoleAssignmentTabSelect = (_: React.MouseEvent<HTMLElement, MouseEvent>, key: string | number) => {
    const selectedTabKey = Object.keys(ROLE_ASSIGNMENT_TABS).find(
      (tab): tab is keyof typeof ROLE_ASSIGNMENT_TABS => ROLE_ASSIGNMENT_TABS[tab as keyof typeof ROLE_ASSIGNMENT_TABS] === key,
    );
    if (selectedTabKey && selectedTabKey !== activeRoleAssignmentTabString) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('roleAssignmentTab', selectedTabKey);
      setSearchParams(newParams);
    }
  };

  return (
    <>
      <WorkspaceHeader workspace={selectedWorkspace} isLoading={isLoading} workspaceHierarchy={workspaceHierarchy} hasAssets={hasAssets} />
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
        {activeTabString === 'assets' ? (
          <AssetsCards workspaceName={selectedWorkspace?.name} />
        ) : (
          enableRoles && (
            <>
              <div className="pf-v5-u-background-color-100">
                <Tabs
                  activeKey={ROLE_ASSIGNMENT_TABS[activeRoleAssignmentTabString as keyof typeof ROLE_ASSIGNMENT_TABS]}
                  onSelect={handleRoleAssignmentTabSelect}
                  inset={{ default: 'insetNone', md: 'insetSm', xl: 'insetLg' }}
                  className="pf-v5-u-background-color-100"
                >
                  <Tab
                    eventKey={ROLE_ASSIGNMENT_TABS['roles-assigned-in-workspace']}
                    title="Roles assigned in this Workspace"
                    tabContentId="rolesAssignedInWorkspaceTab"
                  />
                  <Tab
                    eventKey={ROLE_ASSIGNMENT_TABS['roles-assigned-outside']}
                    title="Roles assigned outside"
                    tabContentId="rolesAssignedOutsideTab"
                  />
                </Tabs>
                <div className="pf-v5-u-background-color-100">
                  {activeRoleAssignmentTabString === 'roles-assigned-in-workspace' ? (
                    <RoleAssignmentsTable
                      groups={groups}
                      totalCount={groupsTotalCount}
                      isLoading={groupsIsLoading}
                      page={groupsPage}
                      perPage={groupsPerPage}
                      onPaginationChange={handleGroupsPaginationChange}
                      sortBy={groupsSortBy}
                      direction={groupsDirection}
                      onSort={handleGroupsSort}
                      filters={groupsFilters}
                      onSetFilters={handleGroupsSetFilters}
                      clearAllFilters={handleGroupsClearAllFilters}
                    />
                  ) : (
                    <div className="pf-v5-u-background-color-100 pf-v5-u-p-lg pf-v5-u-text-align-center">Roles assigned outside - Coming soon</div>
                  )}
                </div>
              </div>
            </>
          )
        )}
      </PageSection>
    </>
  );
};

export default WorkspaceDetail;
