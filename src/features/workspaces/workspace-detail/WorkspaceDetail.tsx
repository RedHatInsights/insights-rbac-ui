import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Divider, PageSection, Tab, Tabs } from '@patternfly/react-core';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDataViewFilters, useDataViewPagination, useDataViewSort } from '@patternfly/react-data-view';
import messages from '../../../Messages';
import AssetsCards from './components/AssetsCards';
import { RoleAssignmentsTable } from './components/RoleAssignmentsTable';
import { GroupWithInheritance } from './components/GroupDetailsDrawer';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { useWorkspacesFlag } from '../../../hooks/useWorkspacesFlag';
import { type WorkspacesWorkspace, useWorkspaceQuery, useWorkspacesQuery } from '../../../data/queries/workspaces';
import type { Group } from '../../../data/queries/groups';
import { useRoleAssignmentsQuery } from '../../../data/queries/rolesV2';

// Extended subject type for role bindings (API returns more than the type definition)
interface RoleBindingSubject {
  id?: string;
  type?: string;
  group?: {
    name?: string;
    description?: string;
    user_count?: number;
  };
  user?: {
    username?: string;
  };
}

// Role binding structure from API
interface RoleBinding {
  last_modified?: string;
  subject?: RoleBindingSubject;
  roles?: Array<{
    id?: string;
    name?: string;
  }>;
  resource?: {
    id?: string;
    name?: string;
    type?: string;
  };
  inherited_from?: {
    name?: string;
    type?: string;
  };
}

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

  // React Query hooks
  const { data: workspacesData, isLoading: isWorkspacesLoading } = useWorkspacesQuery();
  const workspaces = (workspacesData?.data ?? []) as WorkspacesWorkspace[];

  const { data: selectedWorkspace, isLoading: isWorkspaceLoading } = useWorkspaceQuery(workspaceId || '', {
    enabled: !!workspaceId,
  });

  const isLoading = isWorkspacesLoading || isWorkspaceLoading;

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

  // Role bindings queries
  const shouldFetchRoleBindings = activeTabString === 'roles' && enableRoles && activeRoleAssignmentTabString === 'roles-assigned-in-workspace';
  const { data: roleBindingsData, isLoading: roleBindingsIsLoading } = useRoleAssignmentsQuery(workspaceId || '', {
    enabled: shouldFetchRoleBindings && !!workspaceId,
    limit: perPage,
  });

  // Parent role bindings query
  const shouldFetchParentBindings =
    activeTabString === 'roles' &&
    enableRoles &&
    activeRoleAssignmentTabString === 'roles-assigned-in-parent-workspaces' &&
    !!selectedWorkspace?.parent_id;
  const { data: parentBindingsData, isLoading: parentGroupsIsLoading } = useRoleAssignmentsQuery(selectedWorkspace?.parent_id || '', {
    enabled: shouldFetchParentBindings,
    limit: parentPerPage,
    parentRoleBindings: true,
  });

  // Transform role bindings to Group structure for the table
  // Note: These are role binding representations, not actual RBAC groups,
  // but we use Group type for compatibility with RoleAssignmentsTable
  const roleBindings: Group[] = useMemo(() => {
    if (!roleBindingsData?.data) return [];
    return roleBindingsData.data.map((binding: RoleBinding) => {
      // Cast subject to extended type that includes group/user details
      const subject = binding.subject as RoleBindingSubject | undefined;
      return {
        uuid: subject?.id || '',
        name: subject?.group?.name || subject?.user?.username || 'Unknown',
        description: subject?.group?.description || '',
        principalCount: subject?.group?.user_count || 0,
        roleCount: binding.roles?.length || 0,
        created: binding.last_modified ?? '',
        modified: binding.last_modified ?? '',
        platform_default: false,
        system: false,
        admin_default: false,
      } as Group;
    });
  }, [roleBindingsData]);

  const roleBindingsTotalCount = roleBindingsData?.data?.length ?? 0;

  // Transform parent bindings with inheritance info
  const parentGroups: GroupWithInheritance[] = useMemo(() => {
    if (!parentBindingsData?.data || !selectedWorkspace?.parent_id) return [];

    const parentWorkspace = workspaces.find((w) => w.id === selectedWorkspace.parent_id);
    const parentWorkspaceName = parentWorkspace?.name || 'Parent Workspace';

    return parentBindingsData.data.map((binding: RoleBinding) => {
      // Cast subject to extended type that includes group/user details
      const subject = binding.subject as RoleBindingSubject | undefined;
      return {
        uuid: subject?.id || '',
        name: subject?.group?.name || subject?.user?.username || 'Unknown',
        description: subject?.group?.description || '',
        principalCount: subject?.group?.user_count || 0,
        roleCount: binding.roles?.length || 0,
        created: binding.last_modified ?? '',
        modified: binding.last_modified ?? '',
        platform_default: false,
        system: false,
        admin_default: false,
        inheritedFrom: {
          workspaceId: selectedWorkspace.parent_id!, // Already checked parent_id exists in condition above
          workspaceName: parentWorkspaceName,
        },
      } as GroupWithInheritance;
    });
  }, [parentBindingsData, selectedWorkspace, workspaces]);

  const parentGroupsTotalCount = parentBindingsData?.data?.length ?? 0;

  // Workspace hierarchy state
  const [workspaceHierarchy, setWorkspaceHierarchy] = useState<WorkspaceData[]>([]);

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
    if (workspaces.length > 0 && workspaceId) {
      setWorkspaceHierarchy(buildWorkspacesHierarchy(workspaces, workspaceId));
    }
  }, [workspaces, workspaceId]);

  const buildWorkspacesHierarchy = (allWorkspaces: WorkspacesWorkspace[], targetWorkspaceId: string): WorkspaceData[] => {
    let currentWorkspace = allWorkspaces.find((ws) => ws.id === targetWorkspaceId);

    const hierarchy: WorkspaceData[] = currentWorkspace ? [{ name: currentWorkspace.name ?? '', id: currentWorkspace.id ?? '' }] : [];
    while (currentWorkspace?.parent_id?.length && currentWorkspace?.parent_id?.length > 0) {
      currentWorkspace = allWorkspaces.find((ws) => ws.id === currentWorkspace?.parent_id);
      if (!currentWorkspace) break;
      hierarchy.unshift({ name: currentWorkspace.name ?? '', id: currentWorkspace.id ?? '' });
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

  const currentWorkspace = selectedWorkspace ? { id: selectedWorkspace.id ?? '', name: selectedWorkspace.name ?? '' } : undefined;

  return (
    <>
      <WorkspaceHeader workspace={selectedWorkspace ?? null} isLoading={isLoading} workspaceHierarchy={workspaceHierarchy} hasAssets={hasAssets} />
      <Divider />
      <Tabs
        className="pf-v6-u-background-color-100"
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
      <PageSection hasBodyWrapper={false} isFilled={activeTabString !== 'assets'}>
        {activeTabString === 'assets' ? (
          <AssetsCards workspaceName={selectedWorkspace?.name || ''} />
        ) : (
          enableRoles && (
            <>
              <Tabs
                activeKey={ROLE_ASSIGNMENT_TABS[activeRoleAssignmentTabString as keyof typeof ROLE_ASSIGNMENT_TABS]}
                onSelect={handleRoleAssignmentTabSelect}
                inset={{ default: 'insetNone', md: 'insetSm', xl: 'insetLg' }}
                className="pf-v6-u-background-color-100"
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
