import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkspace, fetchWorkspaces } from '../../../redux/workspaces/actions';
import { fetchGroups } from '../../../redux/groups/actions';
import { Divider, PageSection, Tab, Tabs } from '@patternfly/react-core';
import { RBACStore } from '../../../redux/store';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDataViewFilters, useDataViewPagination, useDataViewSort } from '@patternfly/react-data-view';
import messages from '../../../Messages';
import AssetsCards from './components/AssetsCards';
import { RoleAssignmentsTable } from './components/RoleAssignmentsTable';
import { GroupWithInheritance } from './components/GroupDetailsDrawer';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { useFlag } from '@unleash/proxy-client-react';
import { Workspace } from '../../../redux/workspaces/reducer';
import { mappedProps } from '../../../helpers/dataUtilities';
import { ListGroupsOrderByEnum } from '@redhat-cloud-services/rbac-client/ListGroups';
import { fetchGroups as fetchGroupsHelper } from '../../../redux/groups/helper';

interface WorkspaceData {
  name: string;
  id: string;
}

interface RoleAssignmentsFilters {
  name: string;
  inheritedFrom?: string;
}

const WORKSPACE_TABS = {
  roles: 0,
  assets: 1,
} as const;

const ROLE_ASSIGNMENT_TABS = {
  'roles-assigned-in-workspace': 0,
  'roles-assigned-in-parent-workspaces': 1,
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

  // Separate parent groups data for RoleAssignmentsTable with inheritance
  const [parentGroups, setParentGroups] = useState<GroupWithInheritance[]>([]);
  const [parentGroupsTotalCount, setParentGroupsTotalCount] = useState(0);
  const [parentGroupsIsLoading, setParentGroupsIsLoading] = useState(false);

  const [workspaceHierarchy, setWorkspaceHierarchy] = useState<WorkspaceData[]>([]);

  // DataView hooks for role assignments table
  const { sortBy, direction, onSort } = useDataViewSort({
    initialSort: {
      sortBy: 'name',
      direction: 'asc' as const,
    },
    searchParams,
    setSearchParams,
  });

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<RoleAssignmentsFilters>({
    initialFilters: { name: '', inheritedFrom: '' },
    searchParams,
    setSearchParams,
  });

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
    searchParams,
    setSearchParams,
  });

  // Parent DataView hooks for parent role assignments table (separate state)
  const [parentSearchParams, setParentSearchParams] = useState(new URLSearchParams());

  const {
    sortBy: parentSortBy,
    direction: parentDirection,
    onSort: parentOnSort,
  } = useDataViewSort({
    initialSort: {
      sortBy: 'name',
      direction: 'asc' as const,
    },
    searchParams: parentSearchParams,
    setSearchParams: setParentSearchParams,
  });

  const {
    filters: parentFilters,
    onSetFilters: parentOnSetFilters,
    clearAllFilters: parentClearAllFilters,
  } = useDataViewFilters<RoleAssignmentsFilters>({
    initialFilters: { name: '', inheritedFrom: '' },
    searchParams: parentSearchParams,
    setSearchParams: setParentSearchParams,
  });

  const {
    page: parentPage,
    perPage: parentPerPage,
    onSetPage: parentOnSetPage,
    onPerPageSelect: parentOnPerPageSelect,
  } = useDataViewPagination({
    perPage: 20,
    searchParams: parentSearchParams,
    setSearchParams: setParentSearchParams,
  });

  // Groups data fetching
  const fetchGroupsData = useCallback(() => {
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
  }, [dispatch, groupsTotalCount, page, perPage, sortBy, direction, filters]);

  const fetchParentGroupsData = useCallback(async () => {
    const offset = (parentPage - 1) * parentPerPage;
    const orderBy = parentSortBy && parentDirection ? `${parentDirection === 'desc' ? '-' : ''}${parentSortBy}` : 'name';
    const nameFilter = parentFilters?.name?.trim() || '';

    setParentGroupsIsLoading(true);

    try {
      // Call the same API helper that Redux uses, but store result in parent state
      const result = await fetchGroupsHelper({
        ...mappedProps({
          count: 0, // Use 0 for initial count to avoid dependency loop
          limit: parentPerPage,
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
      });

      // Store result in parent state and add inheritance information
      const groupsWithInheritance = (result.data || []).map((group: any) => ({
        ...group,
        inheritedFrom: {
          workspaceId: '',
          workspaceName: '',
        },
      }));
      setParentGroups(groupsWithInheritance);
      setParentGroupsTotalCount(result.meta?.count || 0);
    } catch (error) {
      console.error('Error fetching parent groups:', error);
      setParentGroups([]);
      setParentGroupsTotalCount(0);
    } finally {
      // Always set loading to false in finally block
      setParentGroupsIsLoading(false);
    }
  }, [parentPage, parentPerPage, parentSortBy, parentDirection, parentFilters]);

  useEffect(() => {
    if (activeTabString === 'roles' && enableRoles) {
      if (activeRoleAssignmentTabString === 'roles-assigned-in-workspace') {
        fetchGroupsData();
      } else if (activeRoleAssignmentTabString === 'roles-assigned-in-parent-workspaces') {
        // Reset parent data when switching to parent tab
        setParentGroups([]);
        setParentGroupsTotalCount(0);
        fetchParentGroupsData();
      }
    }
  }, [activeTabString, enableRoles, activeRoleAssignmentTabString]);

  // Fetch workspace data when workspace table parameters change
  useEffect(() => {
    if (activeTabString === 'roles' && enableRoles && activeRoleAssignmentTabString === 'roles-assigned-in-workspace') {
      fetchGroupsData();
    }
  }, [fetchGroupsData, activeTabString, enableRoles, activeRoleAssignmentTabString]);

  // Fetch parent data when parent table parameters change
  useEffect(() => {
    if (activeTabString === 'roles' && enableRoles && activeRoleAssignmentTabString === 'roles-assigned-in-parent-workspaces') {
      fetchParentGroupsData();
    }
  }, [parentPage, parentPerPage, parentSortBy, parentDirection, parentFilters, activeTabString, enableRoles, activeRoleAssignmentTabString]);

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
                    title={intl.formatMessage(messages.rolesAssignedInThisWorkspace)}
                    tabContentId="rolesAssignedInWorkspaceTab"
                  />
                  <Tab
                    eventKey={ROLE_ASSIGNMENT_TABS['roles-assigned-in-parent-workspaces']}
                    title={intl.formatMessage(messages.rolesAssignedInParentWorkspaces)}
                    tabContentId="rolesAssignedOutsideTab"
                  />
                </Tabs>
                <div className="pf-v5-u-background-color-100">
                  {activeRoleAssignmentTabString === 'roles-assigned-in-workspace' ? (
                    <RoleAssignmentsTable
                      groups={groups}
                      totalCount={groupsTotalCount}
                      isLoading={groupsIsLoading}
                      page={page}
                      perPage={perPage}
                      onSetPage={onSetPage}
                      onPerPageSelect={onPerPageSelect}
                      sortBy={sortBy}
                      direction={direction}
                      onSort={onSort}
                      filters={filters}
                      onSetFilters={onSetFilters}
                      clearAllFilters={clearAllFilters}
                    />
                  ) : (
                    <RoleAssignmentsTable
                      groups={parentGroups}
                      totalCount={parentGroupsTotalCount}
                      isLoading={parentGroupsIsLoading}
                      page={parentPage}
                      perPage={parentPerPage}
                      onSetPage={parentOnSetPage}
                      onPerPageSelect={parentOnPerPageSelect}
                      sortBy={parentSortBy}
                      direction={parentDirection}
                      onSort={parentOnSort}
                      filters={parentFilters}
                      onSetFilters={parentOnSetFilters}
                      clearAllFilters={parentClearAllFilters}
                      ouiaId="parent-role-assignments-table"
                    />
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
