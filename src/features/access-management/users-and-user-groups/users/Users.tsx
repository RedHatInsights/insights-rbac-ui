import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { DataViewEventsProvider, EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';
import { TabContent } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { type User, useChangeUserStatusMutation } from '../../../../data/queries/users';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { useIntl } from 'react-intl';
import messages from '../../../../Messages';
import PermissionsContext from '../../../../utilities/permissionsContext';
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
  const intl = useIntl();
  const addNotification = useAddNotification();
  const authModel = useFlag('platform.rbac.common-auth-model');
  const isITLess = useFlag('platform.rbac.itless');
  const { getBundle, getApp } = useChrome();
  const appNavigate = useAppNavigate(`/${getBundle()}/${getApp()}`);

  // Use React Query mutation for status changes
  const changeUserStatusMutation = useChangeUserStatusMutation();

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

  // Auth and permissions
  const [accountId, setAccountId] = useState<number | undefined>();
  const { orgAdmin: contextOrgAdmin } = useContext(PermissionsContext);
  const { auth, isProd } = useChrome();
  const [token, setToken] = useState<string | null>(null);

  // Use the context orgAdmin for actual permissions
  const orgAdmin = contextOrgAdmin;

  useEffect(() => {
    const getToken = async () => {
      setToken((await auth.getToken()) as string);
      setAccountId((await auth.getUser())?.identity.org_id as unknown as number);
    };
    getToken();
  }, [auth]);

  // User status toggle handler - now using React Query
  const handleToggleUserStatus = useCallback(
    async (user: User, isActive: boolean) => {
      try {
        await changeUserStatusMutation.mutateAsync({
          users: [
            {
              ...user,
              id: user.external_source_id,
              is_active: isActive,
            },
          ],
          config: { isProd: isProd() || false, token, accountId },
          itless: isITLess,
        });
        addNotification({
          variant: 'success',
          title: intl.formatMessage(messages.editUserSuccessTitle),
          dismissable: true,
          description: intl.formatMessage(messages.editUserSuccessDescription),
        });
      } catch (error) {
        console.error('Failed to update status:', error);
        addNotification({
          variant: 'danger',
          title: intl.formatMessage(messages.editUserErrorTitle),
          dismissable: true,
          description: intl.formatMessage(messages.editUserErrorDescription),
        });
      }
    },
    [changeUserStatusMutation, isProd, token, accountId, intl, isITLess, addNotification],
  );

  // Org admin toggle handler
  const handleToggleOrgAdmin = useCallback((_user: User, _isOrgAdmin: boolean) => {
    // TODO: Implement org admin toggle logic
    console.log(`Toggle org admin for ${_user.username} to ${_isOrgAdmin}`);
  }, []);

  // Delete user handler
  const handleDeleteUser = useCallback((user: User) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  }, []);

  // Bulk status change handler
  const handleBulkStatusChange = useCallback((users: User[]) => {
    setSelectedUsers(users);
    setIsStatusModalOpen(true);
  }, []);

  // Invite users handler
  const handleInviteUsers = useCallback(() => {
    appNavigate(paths['invite-group-users'].link);
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

  const handleBulkDeactivate = useCallback(() => {
    selectedUsers.forEach((user) => {
      handleToggleUserStatus(user, false);
    });
    setIsStatusModalOpen(false);
    setSelectedUsers([]);
  }, [selectedUsers, handleToggleUserStatus]);

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
      onConfirm={handleBulkDeactivate}
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
              isProd={isProd() || false}
              defaultPerPage={defaultPerPage}
              ouiaId={ouiaId}
              onAddUserClick={handleOpenAddUserToGroupModal}
              onRemoveUserFromGroupClick={handleOpenRemoveUserFromGroupModal}
              onInviteUsersClick={handleInviteUsers}
              onToggleUserStatus={handleToggleUserStatus}
              onToggleOrgAdmin={handleToggleOrgAdmin}
              onDeleteUser={handleDeleteUser}
              onBulkStatusChange={() => handleBulkStatusChange(selectedUsers)}
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
    </>
  );
};

// Export both named and default for feature containers
export default Users;
