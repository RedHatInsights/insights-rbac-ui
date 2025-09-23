import React, { Fragment, Suspense, useCallback, useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet, useSearchParams } from 'react-router-dom';
import { DataViewEventsProvider, EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';
import { TabContent } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import PermissionsContext from '../../../../utilities/permissionsContext';

import { removeGroups } from '../../../../redux/groups/actions';
import { Group } from '../../../../redux/groups/reducer';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import pathnames from '../../../../utilities/pathnames';
import { useUserGroups } from './useUserGroups';
import { UserGroupsTable } from './components/UserGroupsTable';
import { GroupDetailsDrawer } from './components/GroupDetailsDrawer';
import { GroupDetailsRolesView } from './user-group-detail/GroupDetailsRolesView';
import { GroupDetailsServiceAccountsView } from './user-group-detail/GroupDetailsServiceAccountsView';
import { GroupDetailsUsersView } from './user-group-detail/GroupDetailsUsersView';
import { DeleteGroupModal } from './components/DeleteGroupModal';

interface UserGroupsProps {
  groupsRef?: React.RefObject<HTMLDivElement>;
  defaultPerPage?: number;
  ouiaId?: string;
}

export const UserGroups: React.FC<UserGroupsProps> = ({ groupsRef, defaultPerPage = 20, ouiaId = 'iam-user-groups-table' }) => {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const [searchParams] = useSearchParams();

  // Use the custom hook for all UserGroups business logic
  const {
    groups,
    isLoading,
    totalCount,
    filters,
    sortBy,
    direction,
    onSort,
    pagination,
    selection,
    focusedGroup,
    setFocusedGroup,
    fetchData,
    handleRowClick,
    clearAllFilters,
    onSetFilters,
  } = useUserGroups({ enableAdminFeatures: true });

  // Tab state for group details drawer
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const drawerRef = React.useRef<HTMLDivElement>(null);

  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentGroups, setCurrentGroups] = useState<Group[]>([]);

  // Note: focusedGroup is now properly typed as Group | undefined from the hook

  // Permission and environment context
  const { orgAdmin } = useContext(PermissionsContext);
  const { isProd } = useChrome();

  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  // Note: Data fetching and state management is now handled by the useUserGroups hook automatically

  // Handle DataView events context for drawer
  const context = useDataViewEventsContext();
  useEffect(() => {
    const unsubscribe = context.subscribe(EventTypes.rowClick, (group: Group | undefined) => {
      // Use the hook's handler for focus state
      if (group) {
        handleRowClick(group);
      }
      // Set focus state using the hook
      setFocusedGroup(group);
      drawerRef.current?.focus();
    });

    return () => unsubscribe();
  }, [context, handleRowClick]);

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

      // Refresh data after deletion - use hook's fetchData
      const { page: currentPage, perPage: currentPerPage } = pagination;
      fetchData({
        limit: currentPerPage,
        offset: (currentPage - 1) * currentPerPage,
        orderBy: (sortBy || 'name') as any, // Cast to satisfy enum requirement
        filters,
      });
    } catch (error) {
      console.error('Failed to delete groups:', error);
    }
  }, [dispatch, currentGroups, fetchData, pagination, sortBy, filters]);

  // Close delete modal
  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setCurrentGroups([]);
  }, []);

  // Note: Selection is now managed by the useUserGroups hook

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
              sortBy={sortBy}
              direction={direction}
              onSort={onSort}
              filters={filters}
              onSetFilters={onSetFilters}
              clearAllFilters={clearAllFilters}
              page={page}
              perPage={perPage}
              onSetPage={onSetPage}
              onPerPageSelect={onPerPageSelect}
              pagination={pagination}
              onRowClick={(group: Group | undefined) => {
                setFocusedGroup(group);
                if (group) {
                  handleRowClick(group);
                }
              }}
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
              pagination: { limit: perPage },
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
