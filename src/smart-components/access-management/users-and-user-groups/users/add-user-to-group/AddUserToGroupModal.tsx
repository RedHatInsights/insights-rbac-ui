import React from 'react';
import { Button, Modal, ModalVariant } from '@patternfly/react-core';
import { FormattedMessage, useIntl } from 'react-intl';
import UserGroupsTable from '../../user-groups/UserGroupsTable';
import { useDispatch } from 'react-redux';
import { addMembersToGroup } from '../../../../../redux/actions/group-actions';
import messages from '../../../../../Messages';

interface AddUserToGroupModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedUsers: any[];
}

export const AddUserToGroupModal: React.FunctionComponent<AddUserToGroupModalProps> = ({ isOpen, setIsOpen, selectedUsers }) => {
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
