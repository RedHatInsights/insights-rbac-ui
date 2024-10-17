import { Button, Modal } from '@patternfly/react-core';
import React from 'react';
import UserGroupsTable from './UserGroupsTable';

interface AddUserGroupModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedUsers: any[];
  isRemoving?: boolean;
}

export const AddUserGroupModal: React.FunctionComponent<AddUserGroupModalProps> = ({ isOpen, setIsOpen, selectedUsers, isRemoving = false }) => {
  const [selectedGroups, setSelectedGroups] = React.useState<any[]>([]);
  const handleUserGroupsChange = (groups: any[]) => setSelectedGroups(groups);

  const handleCloseModal = () => setIsOpen(false);

  const handleAddUsers = () => {
    console.log(`adding ${selectedUsers} to ${selectedGroups}`);
    setIsOpen(false);
  };

  const handleRemoveUsers = () => {
    console.log(`removing ${selectedUsers} from ${selectedGroups}`);
    setIsOpen(false);
  };

  return (
    <Modal
      title={isRemoving ? 'Remove from user group' : 'Add to user group'}
      isOpen={isOpen}
      onClose={handleCloseModal}
      actions={[
        isRemoving ? (
          <Button key="remove" variant="primary" onClick={handleRemoveUsers} isDisabled={selectedGroups.length === 0}>
            Remove
          </Button>
        ) : (
          <Button key="add" variant="primary" onClick={handleAddUsers} isDisabled={selectedGroups.length === 0}>
            Add
          </Button>
        ),
        <Button key="cancel" variant="link" onClick={handleCloseModal}>
          Cancel
        </Button>,
      ]}
      ouiaId={'add-user-group-modal'}
    >
      Select a user group to {isRemoving ? 'remove ' : 'add '}
      <span className="pf-v5-u-font-weight-bold">
        {selectedUsers.length} user{selectedUsers.length > 1 && 's'}
      </span>
      {isRemoving ? ' from' : ' to'}. These are all the user groups in your account. To manage user groups, go to user groups.
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
