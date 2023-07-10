import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Button, Modal, ModalVariant, StackItem, Stack, TextContent } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { addMembersToGroup, fetchMembersForGroup, fetchGroups } from '../../../redux/actions/group-actions';
import UsersList from '../add-group/users-list';
import ActiveUser from '../../../presentational-components/shared/ActiveUsers';
import useAppNavigate from '../../../hooks/useAppNavigate';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';

const AddGroupMembers = ({ closeUrl }) => {
  const chrome = useChrome();
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { groupId } = useParams();
  const dispatch = useDispatch();

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
      dispatch(addMembersToGroup(groupId, userList)).then(() => {
        dispatch(fetchMembersForGroup(groupId));
        dispatch(fetchGroups({ usesMetaInURL: true, chrome }));
      });
    }
    navigate(closeUrl);
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
    navigate(closeUrl);
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
          <UsersList selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} displayNarrow />
        </StackItem>
      </Stack>
    </Modal>
  );
};

AddGroupMembers.defaultProps = {
  closeUrl: pathnames.groups.link,
};

AddGroupMembers.propTypes = {
  closeUrl: PropTypes.string,
};

export default AddGroupMembers;
