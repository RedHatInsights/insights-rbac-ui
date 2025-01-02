import React from 'react';
import { DataViewEventsProvider } from '@patternfly/react-data-view';
import { TabContent } from '@patternfly/react-core';
import UserDetailsDrawer from './user-detail/UserDetailsDrawer';
import UsersTable from './UsersTable';
import { User } from '../../../../redux/reducers/user-reducer';
import AddUserToGroupModal from './add-user-to-group/AddUserToGroupModal';

interface UsersViewProps {
  usersRef?: React.Ref<HTMLElement>;
}

const UsersView: React.FunctionComponent<UsersViewProps> = ({ usersRef }) => {
  const [focusedUser, setFocusedUser] = React.useState<User | undefined>(undefined);
  const [selectedUsers, setSelectedUsers] = React.useState<User[]>([]);
  const [isAddUserGroupModalOpen, setIsAddUserGroupModalOpen] = React.useState<boolean>(false);

  const handleOpenAddUserToGroupModal = (selected: User[]) => {
    if (selected.length > 0) {
      setSelectedUsers(selected);
      setIsAddUserGroupModalOpen(true);
    }
  };

  return (
    <>
      <AddUserToGroupModal isOpen={isAddUserGroupModalOpen} setIsOpen={setIsAddUserGroupModalOpen} selectedUsers={selectedUsers} />
      <DataViewEventsProvider>
        <UserDetailsDrawer ouiaId="user-details-drawer" setFocusedUser={setFocusedUser} focusedUser={focusedUser}>
          <TabContent eventKey={0} id="usersTab" ref={usersRef} aria-label="Users tab">
            <UsersTable onAddUserClick={handleOpenAddUserToGroupModal} focusedUser={focusedUser} />
          </TabContent>
        </UserDetailsDrawer>
      </DataViewEventsProvider>
    </>
  );
};

export default UsersView;
