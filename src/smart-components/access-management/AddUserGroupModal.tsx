import { Button, Modal } from '@patternfly/react-core';
import React from 'react';
import UserGroupsTable from './UserGroupsTable';
import { useDispatch } from 'react-redux';
import { addMembersToGroup } from '../../redux/actions/group-actions';

interface AddUserGroupModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedUsers: any[];
}

export const AddUserGroupModal: React.FunctionComponent<AddUserGroupModalProps> = ({ isOpen, setIsOpen, selectedUsers }) => {
  const [selectedGroups, setSelectedGroups] = React.useState<any[]>([]);
  const handleUserGroupsChange = (groups: any[]) => setSelectedGroups(groups);
  const dispatch = useDispatch();

  const handleCloseModal = () => setIsOpen(false);

  const handleAddUsers = () => {
    const selectedUsernames = selectedUsers.map((user) => ({username: user[0]})); // TODO: fix - this seems gross
    selectedGroups.forEach((group) => {
      console.log(`Adding ${JSON.stringify(selectedUsernames)} to group ${group.name} - ${group.uuid}`);
      //dispatch(addMembersToGroup(group.uuid, selectedUsernames)); // TODO: fix 'user' not found 404 error
    });
    setIsOpen(false);
  };

  return (
    <Modal
      title={'Add to user group'}
      isOpen={isOpen}
      onClose={handleCloseModal}
      actions={[
        <Button key="add" variant="primary" onClick={handleAddUsers} isDisabled={selectedGroups.length === 0}>
          Add
        </Button>,
        <Button key="cancel" variant="link" onClick={handleCloseModal}>
          Cancel
        </Button>,
      ]}
      ouiaId={'add-user-group-modal'}
    >
      Select a user group to add{' '}
      <span className="pf-v5-u-font-weight-bold">
        {selectedUsers.length} user{selectedUsers.length > 1 && 's'}{' '}
      </span>
      to. These are all the user groups in your account. To manage user groups, go to user groups.
      <UserGroupsTable
        defaultPerPage={10}
        useUrlParams={false}
        ouiaId="iam-add-users-modal-table"
        onChange={handleUserGroupsChange}
        enableActions={false}
      />
    </Modal>
  );
};

export default AddUserGroupModal;
