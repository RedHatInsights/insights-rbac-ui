import React, { Fragment, Suspense, useCallback, useContext, useEffect, useState } from 'react';
import { Outlet, useSearchParams } from 'react-router-dom';
import { DataViewEventsProvider, EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';
import { TabContent } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { useAccessPermissions } from '../../../../hooks/useAccessPermissions';
import PermissionsContext from '../../../../utilities/permissionsContext';

import { useDeleteGroupMutation } from '../../../../data/queries/groups';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import pathnames from '../../../../utilities/pathnames';
import { type Group, useUserGroups } from './useUserGroups';
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
  const navigate = useAppNavigate();
  const [searchParams] = useSearchParams();

  // React Query mutation for deleting groups
  const deleteGroupMutation = useDeleteGroupMutation();

  // Use the custom hook for all UserGroups business logic
  const { groups, isLoading, totalCount, tableState, focusedGroup, setFocusedGroup, refetch, handleRowClick } = useUserGroups({
    enableAdminFeatures: true,
  });

  // Tab state for group details drawer
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const drawerRef = React.useRef<HTMLDivElement>(null);

  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentGroups, setCurrentGroups] = useState<Group[]>([]);

  // Note: focusedGroup is now properly typed as Group | undefined from the hook

  // Permission context
  const { orgAdmin: contextOrgAdmin } = useContext(PermissionsContext);

  // Check write permission for group actions
  const { hasAccess: canWriteGroups } = useAccessPermissions(['rbac:group:write']);

  // Combined permission check - user must be org admin AND have granular write permission
  const orgAdmin = (contextOrgAdmin ?? false) && (canWriteGroups ?? false);

  // Extract perPage for outlet context
  const { perPage } = tableState;

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
      navigate(pathnames['users-and-user-groups-edit-group'].link(group.uuid));
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

  // Confirm deletion - using React Query mutation
  const handleConfirmDelete = useCallback(async () => {
    try {
      // Delete all groups sequentially
      for (const group of currentGroups) {
        await deleteGroupMutation.mutateAsync(group.uuid);
      }
      setIsDeleteModalOpen(false);
      setCurrentGroups([]);
      // Note: React Query automatically invalidates and refetches after mutation
    } catch (error) {
      console.error('Failed to delete groups:', error);
      // Note: Error notification is handled by the mutation hook
    }
  }, [currentGroups, deleteGroupMutation]);

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
          groupId={focusedGroup?.uuid}
          onClose={() => setFocusedGroup(undefined)}
          onEditGroup={focusedGroup ? () => handleEditGroup(focusedGroup) : undefined}
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
              enableActions={orgAdmin}
              orgAdmin={orgAdmin}
              ouiaId={ouiaId}
              // Table state from useTableState - managed by container
              tableState={tableState}
              onRowClick={(group: Group | undefined) => {
                setFocusedGroup(group);
                if (group) {
                  handleRowClick(group);
                }
              }}
              onEditGroup={handleEditGroup}
              onDeleteGroup={handleDeleteGroup}
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
                navigate({ pathname: pathnames['user-groups'].link() });
              },
              onCancel: () =>
                navigate({
                  pathname: pathnames['user-groups'].link(),
                  search: searchParams.toString(),
                }),
              enableRoles: false,
              pagination: { limit: perPage },
              filters: {},
              postMethod: refetch,
            },
          }}
        />
      </Suspense>
    </Fragment>
  );
};

// Export both named and default for feature containers
export default UserGroups;
