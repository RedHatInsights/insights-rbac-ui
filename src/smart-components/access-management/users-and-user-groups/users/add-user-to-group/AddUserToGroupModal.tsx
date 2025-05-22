import { Button, Modal, ModalVariant } from '@patternfly/react-core';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import messages from '../../../../../Messages';
import { useGroupActions } from '../../../../../redux/actions/group-actions';
import UserGroupsTable from '../../user-groups/UserGroupsTable';

interface AddUserToGroupModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedUsers: string[];
}

export const AddUserToGroupModal: React.FunctionComponent<AddUserToGroupModalProps> = ({ isOpen, setIsOpen, selectedUsers }) => {
  const [selectedGroups, setSelectedGroups] = React.useState<string[]>([]);
  const handleUserGroupsChange = (groups: string[]) => setSelectedGroups(groups);
  const dispatch = useDispatch();
  const intl = useIntl();
  const { addMembersToGroup } = useGroupActions();

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
      variant={ModalVariant.medium}
      title={intl.formatMessage(messages['addToUserGroup'])}
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

export default AddUserToGroupModal;
