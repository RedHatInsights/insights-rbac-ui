import { Button, Modal } from '@patternfly/react-core';
import React from 'react';
import UserGroupsTable from './UserGroupsTable';

export const AddUserGroupModal: React.FunctionComponent = () => {
  const [isOpen, setIsOpen] = React.useState(true);

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
      Select a user group to add <span className="pf-v5-u-font-weight-bold">X users</span> to. These are all the user groups in your account. To
      manage user groups, go to user groups.
      <UserGroupsTable defaultPerPage={10} useUrlParams={false} />
    </Modal>
  );
};

export default AddUserGroupModal;
