import React, { Fragment, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useSearchParams } from 'react-router-dom';
import {
  DataViewEventsProvider,
  EventTypes,
  useDataViewEventsContext,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSelection,
  useDataViewSort,
} from '@patternfly/react-data-view';
import { TabContent } from '@patternfly/react-core';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import PermissionsContext from '../../../../utilities/permissionsContext';

import { mappedProps } from '../../../../helpers/dataUtilities';
import { RBACStore } from '../../../../redux/store';
import { fetchGroups, removeGroups } from '../../../../redux/groups/actions';
import { Group } from '../../../../redux/groups/reducer';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import pathnames from '../../../../utilities/pathnames';
import { UserGroupsTable } from './components/UserGroupsTable';
import { GroupDetailsDrawer } from './components/GroupDetailsDrawer';
import { GroupDetailsRolesView } from './user-group-detail/GroupDetailsRolesView';
import { GroupDetailsServiceAccountsView } from './user-group-detail/GroupDetailsServiceAccountsView';
import { GroupDetailsUsersView } from './user-group-detail/GroupDetailsUsersView';
import { DeleteGroupModal } from './components/DeleteGroupModal';

interface UserGroupsFilters {
  name: string;
}

interface UserGroupsProps {
  groupsRef?: React.RefObject<HTMLDivElement>;
  defaultPerPage?: number;
  ouiaId?: string;
}

export const UserGroups: React.FC<UserGroupsProps> = ({ groupsRef, defaultPerPage = 20, ouiaId = 'iam-user-groups-table' }) => {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Focus state for group details drawer
  const [focusedGroup, setFocusedGroup] = useState<Group | undefined>();

  // Tab state for group details drawer
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const drawerRef = React.useRef<HTMLDivElement>(null);

  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentGroups, setCurrentGroups] = useState<Group[]>([]);

  // Redux state - using separate selectors to avoid creating new objects
  const groups = useSelector((state: RBACStore) => state.groupReducer?.groups?.data || []);
  const totalCount = useSelector((state: RBACStore) => state.groupReducer?.groups?.meta.count || 0);
  const isLoading = useSelector((state: RBACStore) => state.groupReducer?.isLoading || false);

  // Permission and environment context
  const { orgAdmin } = useContext(PermissionsContext);
  const { isProd } = useChrome();

  // Data view hooks - managing state in container
  const { onSort } = useDataViewSort({
    searchParams,
    setSearchParams,
    initialSort: {
      sortBy: 'name',
      direction: 'asc',
    },
  });

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<UserGroupsFilters>({
    initialFilters: { name: '' },
    searchParams,
    setSearchParams,
  });

  const pagination = useDataViewPagination({
    perPage: defaultPerPage,
    searchParams,
    setSearchParams,
  });

  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  // Parse current pagination and sorting from URL params
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentPerPage = parseInt(searchParams.get('per_page') || defaultPerPage.toString(), 10);
  const currentSortBy = searchParams.get('sort_by') || 'name';
  const currentDirection = searchParams.get('sort_direction') || 'asc';

  // Memoize filters to prevent infinite re-renders
  const currentFilters: UserGroupsFilters = useMemo(
    () => ({
      name: searchParams.get('name') || '',
    }),
    [searchParams],
  );

  // Data fetching function
  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; orderBy: string; filters: UserGroupsFilters }) => {
      const { count, limit, offset, orderBy, filters } = apiProps;
      const orderDirection = currentDirection === 'desc' ? '-' : '';
      dispatch(
        fetchGroups({
          ...mappedProps({ count, limit, offset, orderBy: `${orderDirection}${orderBy}` as any, filters }),
          usesMetaInURL: true,
          system: false,
        }),
      );
    },
    [dispatch, currentDirection],
  );

  // Fetch data when URL params change
  useEffect(() => {
    fetchData({
      limit: currentPerPage,
      offset: (currentPage - 1) * currentPerPage,
      orderBy: currentSortBy,
      count: totalCount || 0,
      filters: currentFilters,
    });
  }, [fetchData, currentPage, currentPerPage, currentSortBy, currentFilters]);

  // Handle row click for group focus
  const handleRowClick = useCallback((group: Group | undefined) => {
    setFocusedGroup(group);
  }, []);

  // Handle DataView events context for drawer
  const context = useDataViewEventsContext();
  useEffect(() => {
    const unsubscribe = context.subscribe(EventTypes.rowClick, (group: Group | undefined) => {
      setFocusedGroup(group);
      drawerRef.current?.focus();
    });

    return () => unsubscribe();
  }, [context]);

  // Handle edit group navigation
  const handleEditGroup = useCallback(
    (group: Group) => {
      navigate(pathnames['users-and-user-groups-edit-group'].link.replace(':groupId', group.uuid));
    },
    [navigate],
  );

  // Handle delete group modal
  const handleDeleteGroup = useCallback((group: Group) => {
    setCurrentGroups([group]);
    setIsDeleteModalOpen(true);
  }, []);

  // Handle bulk delete (if multiple groups selected)
  // TODO: Implement bulk delete functionality
  // const handleDeleteGroups = useCallback((groupsToDelete: Group[]) => {
  //   setCurrentGroups(groupsToDelete);
  //   setIsDeleteModalOpen(true);
  // }, []);

  // Confirm deletion
  const handleConfirmDelete = useCallback(async () => {
    try {
      await dispatch(removeGroups(currentGroups.map((group) => group.uuid)));
      setIsDeleteModalOpen(false);
      setCurrentGroups([]);

      // Refresh data after deletion
      fetchData({
        limit: currentPerPage,
        offset: (currentPage - 1) * currentPerPage,
        orderBy: currentSortBy,
        count: totalCount || 0,
        filters: currentFilters,
      });
    } catch (error) {
      console.error('Failed to delete groups:', error);
    }
  }, [dispatch, currentGroups, fetchData, currentPage, currentPerPage, currentSortBy, totalCount, currentFilters]);

  // Close delete modal
  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setCurrentGroups([]);
  }, []);

  // Selection for bulk operations
  const selection = useDataViewSelection({
    matchOption: (a, b) => a.row[0] === b.row[0], // Match based on group name (first column)
  });

  // Delete modal component
  const deleteModal = (
    <DeleteGroupModal
      isOpen={isDeleteModalOpen}
      groups={currentGroups}
      onClose={handleCloseDeleteModal}
      onConfirm={handleConfirmDelete}
      ouiaId={`${ouiaId}-delete-modal`}
    />
  );

  // Individual render functions for each tab
  const renderUsersTab = () => {
    if (!focusedGroup) return null;
    return <GroupDetailsUsersView groupId={focusedGroup.uuid} ouiaId={`${ouiaId}-users-view`} />;
  };

  const renderServiceAccountsTab = () => {
    if (!focusedGroup) return null;
    return <GroupDetailsServiceAccountsView groupId={focusedGroup.uuid} ouiaId={`${ouiaId}-service-accounts-view`} />;
  };

  const renderRolesTab = () => {
    if (!focusedGroup) return null;
    return <GroupDetailsRolesView groupId={focusedGroup.uuid} ouiaId={`${ouiaId}-assigned-roles-view`} />;
  };

  return (
    <Fragment>
      <DataViewEventsProvider>
        <GroupDetailsDrawer
          isOpen={Boolean(focusedGroup)}
          groupName={focusedGroup?.name}
          onClose={() => setFocusedGroup(undefined)}
          drawerRef={drawerRef}
          ouiaId="groups-details-drawer"
          activeTabKey={activeTabKey}
          onTabSelect={setActiveTabKey}
          renderUsersTab={renderUsersTab}
          renderServiceAccountsTab={renderServiceAccountsTab}
          renderRolesTab={renderRolesTab}
        >
          <TabContent eventKey={1} id="groupsTab" ref={groupsRef} aria-label="Groups tab">
            <UserGroupsTable
              groups={groups}
              totalCount={totalCount}
              isLoading={isLoading}
              focusedGroup={focusedGroup}
              defaultPerPage={defaultPerPage}
              enableActions={true}
              orgAdmin={orgAdmin}
              isProd={isProd() || false}
              ouiaId={ouiaId}
              // Data view state - managed by container
              onSort={onSort}
              filters={filters}
              onSetFilters={onSetFilters}
              clearAllFilters={clearAllFilters}
              page={page}
              perPage={perPage}
              onSetPage={onSetPage}
              onPerPageSelect={onPerPageSelect}
              pagination={pagination}
              onRowClick={handleRowClick}
              onEditGroup={handleEditGroup}
              onDeleteGroup={handleDeleteGroup}
              selection={selection}
            >
              {deleteModal}
            </UserGroupsTable>
          </TabContent>
        </GroupDetailsDrawer>
      </DataViewEventsProvider>
      <Suspense>
        <Outlet
          context={{
            [pathnames['create-user-group'].path]: {
              afterSubmit: () => {
                navigate({ pathname: pathnames['user-groups'].link });
              },
              onCancel: () =>
                navigate({
                  pathname: pathnames['user-groups'].link,
                  search: searchParams.toString(),
                }),
              enableRoles: false,
              pagination: { limit: currentPerPage },
              filters: {},
              postMethod: fetchData,
            },
          }}
        />
      </Suspense>
    </Fragment>
  );
};

// Export both named and default for feature containers
export default UserGroups;
