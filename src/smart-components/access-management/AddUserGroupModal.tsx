import { Button, Modal } from '@patternfly/react-core';
import React from 'react';
import UserGroupsTable from './UserGroupsTable';
import { useDispatch } from 'react-redux';
import { addMembersToGroup } from '../../redux/actions/group-actions';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../Messages';

interface AddUserGroupModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedUsers: any[];
}

export const AddUserGroupModal: React.FunctionComponent<AddUserGroupModalProps> = ({ isOpen, setIsOpen, selectedUsers }) => {
  const [selectedGroups, setSelectedGroups] = React.useState<any[]>([]);
  const handleUserGroupsChange = (groups: any[]) => setSelectedGroups(groups);
  const dispatch = useDispatch();
  const intl = useIntl();

  const handleCloseModal = () => setIsOpen(false);

  const handleAddUsers = () => {
    const selectedUsernames = selectedUsers.map((user) => ({ username: user.id }));
    selectedGroups.forEach((group) => {
      dispatch(addMembersToGroup(group.id, selectedUsernames));
    });
    setIsOpen(false);
  };

  return (
    <Modal
      title={intl.formatMessage(messages['usersAndUserGroupsAddToGroup'])}
      isOpen={isOpen}
      onClose={handleCloseModal}
      actions={[
        <Button key="add" variant="primary" onClick={handleAddUsers} isDisabled={selectedGroups.length === 0}>
          {intl.formatMessage(messages['usersAndUserGroupsAdd'])}
        </Button>,
        <Button key="cancel" variant="link" onClick={handleCloseModal}>
          {intl.formatMessage(messages['usersAndUserGroupsCancel'])}
        </Button>,
      ]}
      ouiaId="add-user-group-modal"
    >
      <FormattedMessage
        {...messages['usersAndUserGroupsAddUserDescription']}
        values={{
          b: (text) => <b>{text}</b>,
          numUsers: selectedUsers.length,
          plural: selectedUsers.length > 1 ? 'users' : 'user',
        }}
      />
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
