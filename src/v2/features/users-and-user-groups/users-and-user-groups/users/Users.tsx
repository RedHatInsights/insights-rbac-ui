import React, { Suspense, useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useFlag } from '@unleash/proxy-client-react';
import { usePrincipalsAccess } from '../../../../hooks/useRbacAccess';
import { DataViewEventsProvider, EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';
import { TabContent } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import useAppNavigate from '../../../../../shared/hooks/useAppNavigate';
import { type User, useChangeUserStatusMutation, useUpdateUserOrgAdminMutation } from '../../../../../shared/data/queries/users';
import paths from '../../../../utilities/pathnames';
import { useUsers } from './useUsers';
import { UsersTable } from './components/UsersTable';
import { DeleteUserModal } from './components/DeleteUserModal';
import { BulkDeactivateUsersModal } from './components/BulkDeactivateUsersModal';
import { AddUserToGroupModal } from './add-user-to-group/AddUserToGroupModal';
import { RemoveUserFromGroupModal } from './remove-user-from-group/RemoveUserFromGroupModal';
import { UserDetailsDrawer } from './user-detail/UserDetailsDrawer';

interface UsersProps {
  usersRef?: React.RefObject<HTMLDivElement>;
  defaultPerPage?: number;
  ouiaId?: string;
}

export const Users: React.FC<UsersProps> = ({ usersRef, defaultPerPage = 20, ouiaId = 'iam-users-table' }) => {
  const authModel = useFlag('platform.rbac.common-auth-model');
  const appNavigate = useAppNavigate();

  // Mutations handle auth, environment, and notifications internally
  const changeUserStatusMutation = useChangeUserStatusMutation();
  const updateOrgAdminMutation = useUpdateUserOrgAdminMutation();

  // Use the custom hook for all Users business logic
  const { users, isLoading, totalCount, tableState, setFocusedUser, handleRowClick: hookHandleRowClick } = useUsers({ enableAdminFeatures: true });

  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  // Add user to group modal state
  const [selectedUsersForGroup, setSelectedUsersForGroup] = useState<User[]>([]);
  const [isAddUserGroupModalOpen, setIsAddUserGroupModalOpen] = useState(false);

  // Remove user from group modal state
  const [selectedUsersForRemoval, setSelectedUsersForRemoval] = useState<User[]>([]);
  const [isRemoveUserGroupModalOpen, setIsRemoveUserGroupModalOpen] = useState(false);

  // Local focus state for compatibility with existing components (they expect undefined, not null)
  const [localFocusedUser, setLocalFocusedUser] = useState<User | undefined>();

  // Permissions (V2: Kessel domain hooks)
  const { canInvite: orgAdmin } = usePrincipalsAccess();

  const handleToggleUserStatus = useCallback(
    async (user: User, isActive: boolean) => {
      if (user.external_source_id == null) return;
      await changeUserStatusMutation.mutateAsync({
        users: [{ id: user.external_source_id, username: user.username, is_active: isActive }],
      });
    },
    [changeUserStatusMutation],
  );

  const handleToggleOrgAdmin = useCallback(
    async (user: User, isOrgAdmin: boolean) => {
      if (user.external_source_id == null) return;
      await updateOrgAdminMutation.mutateAsync({
        userId: String(user.external_source_id),
        isOrgAdmin,
      });
    },
    [updateOrgAdminMutation],
  );

  // Delete user handler
  const handleDeleteUser = useCallback((user: User) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  }, []);

  const handleBulkActivate = useCallback(
    async (usersToActivate: User[]) => {
      const valid = usersToActivate.filter((u) => u.external_source_id != null);
      if (valid.length === 0) return;
      await changeUserStatusMutation.mutateAsync({
        users: valid.map((user) => ({ id: user.external_source_id, username: user.username, is_active: true })),
      });
    },
    [changeUserStatusMutation],
  );

  // Bulk deactivate handler (opens confirmation modal)
  const handleBulkDeactivate = useCallback((usersToDeactivate: User[]) => {
    setSelectedUsers(usersToDeactivate);
    setIsStatusModalOpen(true);
  }, []);

  // Invite users handler
  const handleInviteUsers = useCallback(() => {
    appNavigate(paths['invite-group-users'].link());
  }, [appNavigate]);

  // Add user to group handler (from UsersView)
  const handleOpenAddUserToGroupModal = useCallback((selected: User[]) => {
    if (selected.length > 0) {
      setSelectedUsersForGroup(selected);
      setIsAddUserGroupModalOpen(true);
    }
  }, []);

  // Remove user from group handler
  const handleOpenRemoveUserFromGroupModal = useCallback((selected: User[]) => {
    if (selected.length > 0) {
      setSelectedUsersForRemoval(selected);
      setIsRemoveUserGroupModalOpen(true);
    }
  }, []);

  // Handle row click for user focus (triggers DataView events for UserDetailsDrawer)
  const context = useDataViewEventsContext();
  const handleRowClick = useCallback(
    (user: User | undefined) => {
      // Use the hook's handler for focus state
      if (user) {
        hookHandleRowClick(user);
        setFocusedUser(user);
      } else {
        setFocusedUser(null);
      }
      // Also set local focus state for compatibility
      setLocalFocusedUser(user);
      // Trigger DataView event so UserDetailsDrawer can subscribe to it
      context.trigger(EventTypes.rowClick, user);
    },
    [context, hookHandleRowClick, setFocusedUser],
  );

  // Modal handlers
  const handleConfirmDelete = useCallback(() => {
    if (currentUser) {
      console.log(`Deleting ${currentUser.username} from user groups`);
      // TODO: Add delete user API call here when v2 is ready
      setIsDeleteModalOpen(false);
      setCurrentUser(undefined);
    }
  }, [currentUser]);

  const handleConfirmBulkDeactivate = useCallback(async () => {
    const valid = selectedUsers.filter((u) => u.external_source_id != null);
    if (valid.length > 0) {
      await changeUserStatusMutation.mutateAsync({
        users: valid.map((user) => ({ id: user.external_source_id, username: user.username, is_active: false })),
      });
    }
    setIsStatusModalOpen(false);
    setSelectedUsers([]);
  }, [selectedUsers, changeUserStatusMutation]);

  // Render modals
  const deleteModal = (
    <DeleteUserModal
      isOpen={isDeleteModalOpen}
      username={currentUser?.username}
      onClose={() => {
        setIsDeleteModalOpen(false);
        setCurrentUser(undefined);
      }}
      onConfirm={handleConfirmDelete}
      ouiaId={`${ouiaId}-remove-user-modal`}
    />
  );

  const statusModal = (
    <BulkDeactivateUsersModal
      isOpen={isStatusModalOpen}
      usernames={selectedUsers.map((user) => user.username)}
      onClose={() => {
        setIsStatusModalOpen(false);
        setSelectedUsers([]);
      }}
      onConfirm={handleConfirmBulkDeactivate}
      ouiaId={`${ouiaId}-deactivate-status-modal`}
    />
  );

  return (
    <>
      <AddUserToGroupModal isOpen={isAddUserGroupModalOpen} setIsOpen={setIsAddUserGroupModalOpen} selectedUsers={selectedUsersForGroup} />
      <RemoveUserFromGroupModal
        isOpen={isRemoveUserGroupModalOpen}
        setIsOpen={setIsRemoveUserGroupModalOpen}
        selectedUsers={selectedUsersForRemoval}
      />
      <DataViewEventsProvider>
        <UserDetailsDrawer ouiaId="user-details-drawer" setFocusedUser={setLocalFocusedUser} focusedUser={localFocusedUser}>
          <TabContent eventKey={0} id="usersTab" ref={usersRef} aria-label="Users tab">
            <UsersTable
              users={users}
              totalCount={totalCount}
              isLoading={isLoading}
              focusedUser={localFocusedUser}
              authModel={authModel}
              orgAdmin={orgAdmin}
              defaultPerPage={defaultPerPage}
              ouiaId={ouiaId}
              onAddUserToGroup={handleOpenAddUserToGroupModal}
              onRemoveUserFromGroup={handleOpenRemoveUserFromGroupModal}
              onInviteUsersClick={handleInviteUsers}
              onToggleUserStatus={handleToggleUserStatus}
              onToggleOrgAdmin={handleToggleOrgAdmin}
              onDeleteUser={handleDeleteUser}
              onBulkActivate={handleBulkActivate}
              onBulkDeactivate={handleBulkDeactivate}
              onRowClick={handleRowClick}
              // Table state props - managed by useTableState via useUsers hook
              tableState={tableState}
            >
              {deleteModal}
              {statusModal}
            </UsersTable>
          </TabContent>
        </UserDetailsDrawer>
      </DataViewEventsProvider>
      <Suspense>
        <Outlet
          context={{
            fetchData: () => {
              appNavigate(paths['users-new'].link());
            },
          }}
        />
      </Suspense>
    </>
  );
};

// Export both named and default for feature containers
export default Users;
