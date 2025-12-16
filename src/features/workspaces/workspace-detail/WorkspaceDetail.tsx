import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkspace, fetchWorkspaces } from '../../../redux/workspaces/actions';
import { getRoleBindingsForSubject } from '../../../redux/workspaces/helper';
import { Divider, PageSection, Tab, Tabs } from '@patternfly/react-core';
import { selectWorkspacesFullState } from '../../../redux/workspaces/selectors';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDataViewFilters, useDataViewPagination, useDataViewSort } from '@patternfly/react-data-view';
import messages from '../../../Messages';
import AssetsCards from './components/AssetsCards';
import { RoleAssignmentsTable } from './components/RoleAssignmentsTable';
import { GroupWithInheritance } from './components/GroupDetailsDrawer';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { useWorkspacesFlag } from '../../../hooks/useWorkspacesFlag';
import { Workspace } from '../../../redux/workspaces/reducer';
import { Group } from '../../../redux/groups/reducer';
import { RoleBindingsRoleBindingBySubject } from '@redhat-cloud-services/rbac-client/v2/types';

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
  const enableRoles = useWorkspacesFlag('m3');
  const activeTabString = searchParams.get('activeTab') || (enableRoles ? 'roles' : 'assets');
  const activeRoleAssignmentTabString = searchParams.get('roleAssignmentTab') || 'roles-assigned-in-workspace';

  const rolesRef = React.createRef<HTMLElement>();
  const assetsRef = React.createRef<HTMLElement>();

  const dispatch = useDispatch();
  const { isLoading, workspaces, selectedWorkspace } = useSelector(selectWorkspacesFullState);

  // Role bindings data for RoleAssignmentsTable (transformed to Group structure)
  const [roleBindings, setRoleBindings] = useState<Group[]>([]);
  const [roleBindingsTotalCount, setRoleBindingsTotalCount] = useState(0);
  const [roleBindingsIsLoading, setRoleBindingsIsLoading] = useState(false);

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

  // Role bindings data fetching
  const fetchRoleBindingsData = useCallback(async () => {
    if (!workspaceId) return;

    setRoleBindingsIsLoading(true);
    try {
      const result = await getRoleBindingsForSubject({
        limit: perPage,
        subjectType: 'group',
        resourceType: 'workspace',
        resourceId: workspaceId,
      });

      // Transform role bindings data to match the expected Group structure
      const transformedData: Group[] =
        result.data?.map(
          (binding: RoleBindingsRoleBindingBySubject): Group => ({
            uuid: binding.subject?.id || '',
            name: binding.resource?.name || 'Unknown',
            description: binding?.subject?.type,
            principalCount: 0,
            roleCount: binding.roles?.length || 0,
            created: binding.last_modified,
            modified: binding.last_modified,
            platform_default: false,
            system: false,
            admin_default: false,
          }),
        ) || [];

      setRoleBindings(transformedData);
      // TODO: the meta does not contain total, let's calculate the total if next link exists
      setRoleBindingsTotalCount(result?.links?.next ? perPage * page + 1 : perPage * page);
    } catch (error) {
      console.error('Error fetching role bindings:', error);
      setRoleBindings([]);
      setRoleBindingsTotalCount(0);
    } finally {
      setRoleBindingsIsLoading(false);
    }
  }, [workspaceId, page, perPage, sortBy, direction, filters]);

  const fetchParentGroupsData = useCallback(async () => {
    if (!selectedWorkspace || !selectedWorkspace.parent_id) {
      // No parent workspace, clear data
      setParentGroups([]);
      setParentGroupsTotalCount(0);
      return;
    }

    setParentGroupsIsLoading(true);

    try {
      // Fetch role bindings from parent workspace
      const result = await getRoleBindingsForSubject({
        limit: parentPerPage,
        subjectType: 'group',
        resourceType: 'workspace',
        resourceId: selectedWorkspace.parent_id,
      });

      // Get parent workspace name for inheritance display
      const parentWorkspace = workspaces.find((w) => w.id === selectedWorkspace.parent_id);
      const parentWorkspaceName = parentWorkspace?.name || 'Parent Workspace';

      // Transform and add inheritance information
      const groupsWithInheritance: GroupWithInheritance[] =
        result.data?.map((binding: RoleBindingsRoleBindingBySubject) => ({
          uuid: binding.subject?.id || '',
          name: binding?.resource?.type || 'Unknown',
          description: '',
          principalCount: 0,
          roleCount: binding.roles?.length || 0,
          created: binding.last_modified,
          modified: binding.last_modified,
          platform_default: false,
          system: false,
          admin_default: false,
          inheritedFrom: {
            workspaceId: selectedWorkspace.parent_id,
            workspaceName: parentWorkspaceName,
          },
        })) || [];

      setParentGroups(groupsWithInheritance);
      // TODO: the meta does not contain total, let's calculate the total if next link exists
      setParentGroupsTotalCount(result?.links?.next ? parentPerPage * parentPage + 1 : parentPerPage * parentPage);
    } catch (error) {
      console.error('Error fetching parent groups:', error);
      setParentGroups([]);
      setParentGroupsTotalCount(0);
    } finally {
      setParentGroupsIsLoading(false);
    }
  }, [selectedWorkspace, workspaces, parentPage, parentPerPage]);

  useEffect(() => {
    if (activeTabString === 'roles' && enableRoles) {
      if (activeRoleAssignmentTabString === 'roles-assigned-in-workspace') {
        fetchRoleBindingsData();
      } else if (activeRoleAssignmentTabString === 'roles-assigned-in-parent-workspaces') {
        // Reset parent data when switching to parent tab
        setParentGroups([]);
        setParentGroupsTotalCount(0);
        fetchParentGroupsData();
      }
    }
  }, [activeTabString, enableRoles, activeRoleAssignmentTabString, fetchRoleBindingsData, fetchParentGroupsData]);

  // Fetch workspace data when workspace table parameters change
  useEffect(() => {
    if (activeTabString === 'roles' && enableRoles && activeRoleAssignmentTabString === 'roles-assigned-in-workspace') {
      fetchRoleBindingsData();
    }
  }, [fetchRoleBindingsData, activeTabString, enableRoles, activeRoleAssignmentTabString]);

  // Fetch parent data when parent table parameters change
  useEffect(() => {
    if (activeTabString === 'roles' && enableRoles && activeRoleAssignmentTabString === 'roles-assigned-in-parent-workspaces') {
      fetchParentGroupsData();
    }
  }, [
    parentPage,
    parentPerPage,
    parentSortBy,
    parentDirection,
    parentFilters,
    activeTabString,
    enableRoles,
    activeRoleAssignmentTabString,
    fetchParentGroupsData,
  ]);

  useEffect(() => {
    if (!searchParams.has('activeTab')) {
      // Default to 'roles' tab if role bindings are enabled (M3+), otherwise 'assets'
      setSearchParams({ activeTab: enableRoles ? 'roles' : 'assets' });
    } else if (!enableRoles && activeTabString !== 'assets') {
      // If roles are disabled but user is on roles tab, redirect to assets
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

  const currentWorkspace = selectedWorkspace ? { id: selectedWorkspace.id, name: selectedWorkspace.name } : undefined;

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
      <PageSection isFilled={activeTabString !== 'assets'}>
        {activeTabString === 'assets' ? (
          <AssetsCards workspaceName={selectedWorkspace?.name || ''} />
        ) : (
          enableRoles && (
            <>
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
              {activeRoleAssignmentTabString === 'roles-assigned-in-workspace' ? (
                <RoleAssignmentsTable
                  key="current-workspace-roles"
                  groups={roleBindings}
                  totalCount={roleBindingsTotalCount}
                  isLoading={roleBindingsIsLoading}
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
                  workspaceName={selectedWorkspace?.name || ''}
                  currentWorkspace={currentWorkspace}
                  ouiaId="current-role-assignments-table"
                />
              ) : (
                <RoleAssignmentsTable
                  key="parent-workspace-roles"
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
                  workspaceName={selectedWorkspace?.name || ''}
                  currentWorkspace={currentWorkspace}
                  ouiaId="parent-role-assignments-table"
                />
              )}
            </>
          )
        )}
      </PageSection>
    </>
  );
};

export default WorkspaceDetail;
