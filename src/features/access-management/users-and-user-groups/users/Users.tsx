import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { useFlag } from '@unleash/proxy-client-react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import {
  DataViewEventsProvider,
  EventTypes,
  useDataViewEventsContext,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSort,
} from '@patternfly/react-data-view';
import { TabContent } from '@patternfly/react-core';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { changeUsersStatus, fetchUsers } from '../../../../redux/users/actions';
import { mappedProps } from '../../../../helpers/dataUtilities';
import PermissionsContext from '../../../../utilities/permissionsContext';
import paths from '../../../../utilities/pathnames';
import { RBACStore } from '../../../../redux/store';
import { User } from '../../../../redux/users/reducer';
import { UsersTable } from './components/UsersTable';
import { DeleteUserModal } from './components/DeleteUserModal';
import { BulkDeactivateUsersModal } from './components/BulkDeactivateUsersModal';
import { AddUserToGroupModal } from './add-user-to-group/AddUserToGroupModal';
import { UserDetailsDrawer } from './user-detail/UserDetailsDrawer';

interface UsersFilters {
  username: string;
  email: string;
}

interface UsersProps {
  usersRef?: React.RefObject<HTMLDivElement>;
  defaultPerPage?: number;
  ouiaId?: string;
}

export const Users: React.FC<UsersProps> = ({ usersRef, defaultPerPage = 20, ouiaId = 'iam-users-table' }) => {
  const authModel = useFlag('platform.rbac.common-auth-model');
  const isITLess = useFlag('platform.rbac.itless');
  const { getBundle, getApp } = useChrome();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const appNavigate = useAppNavigate(`/${getBundle()}/${getApp()}`);

  // Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  // Focus user state
  const [focusedUser, setFocusedUser] = useState<User | undefined>();

  // Add user to group modal state
  const [selectedUsersForGroup, setSelectedUsersForGroup] = useState<User[]>([]);
  const [isAddUserGroupModalOpen, setIsAddUserGroupModalOpen] = useState(false);

  // Redux state
  const { users, totalCount, isLoading } = useSelector((state: RBACStore) => ({
    users: state.userReducer.users.data || [],
    totalCount: state.userReducer.users.meta.count || 0,
    isLoading: state.userReducer.isUserDataLoading,
  }));

  // Auth and permissions
  const [accountId, setAccountId] = useState<number | undefined>();
  const { orgAdmin } = useContext(PermissionsContext);
  const { auth, isProd } = useChrome();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const getToken = async () => {
      setToken((await auth.getToken()) as string);
      setAccountId((await auth.getUser())?.identity.org_id as unknown as number);
    };
    getToken();
  }, [auth]);

  // Data view hooks - moved from presentational component
  const { sortBy, direction, onSort } = useDataViewSort({
    searchParams,
    setSearchParams,
    initialSort: {
      sortBy: 'username',
      direction: 'asc',
    },
  });

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<UsersFilters>({
    initialFilters: { username: '', email: '' },
    searchParams,
    setSearchParams,
  });

  const pagination = useDataViewPagination({
    perPage: defaultPerPage,
    searchParams,
    setSearchParams,
  });

  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  // Data fetching logic - moved from original UsersTable
  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; orderBy: string; filters?: UsersFilters }) => {
      const { count, limit, offset, orderBy, filters } = apiProps;
      const orderDirection = direction === 'desc' ? '-' : '';
      dispatch(
        fetchUsers({
          ...mappedProps({ count, limit, offset, orderBy: `${orderDirection}${orderBy}`, filters }),
          usesMetaInURL: true,
        }),
      );
    },
    [dispatch, direction],
  );

  // Fetch users data with parameters
  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: sortBy || 'username',
      count: totalCount || 0,
      filters,
    });
  }, [fetchData, page, perPage, sortBy, direction, filters, totalCount]);

  // User status toggle handler
  const handleToggleUserStatus = useCallback(
    (user: User, isActive: boolean) => {
      try {
        dispatch(
          changeUsersStatus(
            [
              {
                ...user,
                id: user.external_source_id,
                is_active: isActive,
              },
            ],
            { isProd: isProd() || false, token, accountId },
            isITLess,
          ),
        );
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    },
    [dispatch, isProd, token, accountId],
  );

  // Org admin toggle handler
  const handleToggleOrgAdmin = useCallback((user: User, isOrgAdmin: boolean) => {
    // TODO: Implement org admin toggle logic
    console.log(`Toggle org admin for ${user.username} to ${isOrgAdmin}`);
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

  // Handle row click for user focus (triggers DataView events for UserDetailsDrawer)
  const context = useDataViewEventsContext();
  const handleRowClick = useCallback(
    (user: User | undefined) => {
      setFocusedUser(user);
      // Trigger DataView event so UserDetailsDrawer can subscribe to it
      context.trigger(EventTypes.rowClick, user);
    },
    [context],
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
      <DataViewEventsProvider>
        <UserDetailsDrawer ouiaId="user-details-drawer" setFocusedUser={setFocusedUser} focusedUser={focusedUser}>
          <TabContent eventKey={0} id="usersTab" ref={usersRef} aria-label="Users tab">
            <UsersTable
              users={users}
              totalCount={totalCount}
              isLoading={isLoading}
              focusedUser={focusedUser}
              authModel={authModel}
              orgAdmin={orgAdmin}
              isProd={isProd() || false}
              defaultPerPage={defaultPerPage}
              ouiaId={ouiaId}
              onAddUserClick={handleOpenAddUserToGroupModal}
              onInviteUsersClick={handleInviteUsers}
              onToggleUserStatus={handleToggleUserStatus}
              onToggleOrgAdmin={handleToggleOrgAdmin}
              onDeleteUser={handleDeleteUser}
              onBulkStatusChange={() => handleBulkStatusChange(selectedUsers)}
              onRowClick={handleRowClick}
              // Data view props - now managed by container
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
