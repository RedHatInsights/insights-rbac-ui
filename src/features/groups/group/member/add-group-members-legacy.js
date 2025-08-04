import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useFlag } from '@unleash/proxy-client-react';
import { Button, Modal, ModalVariant, Stack, StackItem, TextContent } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { addMembersToGroup, fetchGroups, fetchMembersForGroup } from '../../../../redux/groups/actions';
import UsersList from '../../add-group/users-list-legacy';
import UsersListItless from '../../add-group/users-list-itless-legacy';
import { ActiveUsers } from '../../../../components/user-management/ActiveUsers';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import messages from '../../../../Messages';
import pathnames from '../../../../utilities/pathnames';

const AddGroupMembers = ({ cancelRoute }) => {
  const chrome = useChrome();
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { groupId } = useParams();
  const dispatch = useDispatch();
  const isITLess = useFlag('platform.rbac.itless');

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
        }),
      );
      dispatch(addMembersToGroup(groupId, userList)).then(() => {
        dispatch(fetchMembersForGroup(groupId));
        dispatch(fetchGroups({ usesMetaInURL: true, chrome }));
      });
    }
    navigate(cancelRoute);
  };

  const onCancel = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(selectedUsers.length > 1 ? messages.addingGroupMembersTitle : messages.addingGroupMemberTitle),
        dismissDelay: 8000,
        description: intl.formatMessage(selectedUsers.length > 1 ? messages.addingGroupMembersCancelled : messages.addingGroupMemberCancelled),
      }),
    );
    navigate(cancelRoute);
  };

  const activeUserProps = {
    ...(!isITLess && { linkDescription: intl.formatMessage(messages.toManageUsersText) }),
  };

  const usersListProps = {
    selectedUsers,
    setSelectedUsers,
    displayNarrow: true,
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
            <ActiveUsers {...activeUserProps} />
          </TextContent>
        </StackItem>
        <StackItem>{isITLess ? <UsersListItless {...usersListProps} /> : <UsersList {...usersListProps} />}</StackItem>
      </Stack>
    </Modal>
  );
};

AddGroupMembers.defaultProps = {
  cancelRoute: pathnames.groups.link,
};

AddGroupMembers.propTypes = {
  cancelRoute: PropTypes.string,
};

export default AddGroupMembers;
