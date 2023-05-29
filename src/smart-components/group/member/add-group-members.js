import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Button, Modal, ModalVariant, StackItem, Stack, TextContent } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { addMembersToGroup, fetchMembersForGroup, fetchGroups } from '../../../redux/actions/group-actions';
import UsersList from '../add-group/users-list';
import ActiveUser from '../../../presentational-components/shared/ActiveUsers';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const AddGroupMembers = ({ closeUrl }) => {
  const { uuid } = useParams();
  const { push } = useHistory();
  const dispatch = useDispatch();
  const intl = useIntl();

  const [selectedUsers, setSelectedUsers] = useState([]);

  const onSubmit = () => {
    const userList = selectedUsers.map((user) => ({ username: user.label }));
    if (userList.length > 0) {
      dispatch(
        addNotification({
          variant: 'info',
          title: intl.formatMessage(userList.length > 1 ? messages.addingGroupMembersTitle : messages.addingGroupMemberTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(userList.length > 1 ? messages.addingGroupMembersDescription : messages.addingGroupMemberDescription),
        })
      );
      dispatch(addMembersToGroup(uuid, userList)).then(() => {
        dispatch(fetchMembersForGroup(uuid));
        dispatch(fetchGroups({ inModal: false }));
      });
    }
    push(closeUrl);
  };

  const onCancel = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(selectedUsers.length > 1 ? messages.addingGroupMembersTitle : messages.addingGroupMemberTitle),
        dismissDelay: 8000,
        description: intl.formatMessage(selectedUsers.length > 1 ? messages.addingGroupMembersCancelled : messages.addingGroupMemberCancelled),
      })
    );
    push(closeUrl);
  };

  return (
    <Modal
      title={intl.formatMessage(messages.addMembers)}
      variant={ModalVariant.medium}
      isOpen
      actions={[
        <Button key="confirm" ouiaId="primary-confirm-button" isDisabled={selectedUsers.length === 0} variant="primary" onClick={onSubmit}>
          {intl.formatMessage(messages.addToGroup)}
        </Button>,
        <Button id="add-groups-cancel" ouiaId="secondary-cancel-button" key="cancel" variant="link" onClick={onCancel}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
      onClose={onCancel}
    >
      <Stack hasGutter>
        <StackItem>
          <TextContent>
            <ActiveUser linkDescription={intl.formatMessage(messages.toManageUsersText)} />
          </TextContent>
        </StackItem>
        <StackItem>
          <UsersList selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} inModal />
        </StackItem>
      </Stack>
    </Modal>
  );
};

AddGroupMembers.defaultProps = {
  closeUrl: '/groups',
};

AddGroupMembers.propTypes = {
  closeUrl: PropTypes.string,
};

export default AddGroupMembers;
