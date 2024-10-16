import { Button, Modal } from '@patternfly/react-core';
import React from 'react';
import UserGroupsTable from './UserGroupsTable';

interface AddUserGroupModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedUsers: any[];
}

export const AddUserGroupModal: React.FunctionComponent<AddUserGroupModalProps> = ({ isOpen, setIsOpen, selectedUsers }) => {
  const handleModalToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Modal
      title="Add to user group"
      isOpen={isOpen}
      onClose={handleModalToggle}
      actions={[
        <Button key="add" variant="primary" onClick={handleModalToggle}>
          Add
        </Button>,
        <Button key="cancel" variant="link" onClick={handleModalToggle}>
          Cancel
        </Button>,
      ]}
      ouiaId={'add-user-group-modal'}
    >
      Select a user group to add <span className="pf-v5-u-font-weight-bold">{selectedUsers.length} users</span> to. These are all the user groups in your account. To
      manage user groups, go to user groups.
      <UserGroupsTable defaultPerPage={10} useUrlParams={false} ouiaId='iam-add-users-modal-table' />
    </Modal>
  );
};

export default AddUserGroupModal;
