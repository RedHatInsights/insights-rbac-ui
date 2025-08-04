import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useFlag } from '@unleash/proxy-client-react';
import { Button, Modal, ModalVariant, Stack, StackItem, TextContent } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { addMembersToGroup, fetchGroups, fetchMembersForGroup } from '../../../../redux/groups/actions';
import { UsersList } from '../../add-group/UsersList';
import UsersListItless from '../../add-group/users-list-itless-legacy';
import { ActiveUsers } from '../../../../components/user-management/ActiveUsers';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import messages from '../../../../Messages';
import type { AddGroupMembersProps } from './types';

export const AddGroupMembers: React.FC<AddGroupMembersProps> = ({ cancelRoute }) => {
  const chrome = useChrome();
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const dispatch = useDispatch();
  const isITLess = useFlag('platform.rbac.itless');

  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  const onSubmit = () => {
    const userList = selectedUsers.map((user) => ({ username: user.label }));
    if (userList.length > 0) {
      dispatch(
        addNotification({
          variant: 'info',
          title: intl.formatMessage(userList.length > 1 ? messages.addingGroupMembersTitle : messages.addingGroupMemberTitle),
          description: intl.formatMessage(userList.length > 1 ? messages.addingGroupMembersDescription : messages.addingGroupMemberDescription),
        }) as any,
      );
      (dispatch(addMembersToGroup(groupId!, userList)) as any).then(() => {
        dispatch(fetchMembersForGroup(groupId!));
        dispatch(fetchGroups({ usesMetaInURL: true, chrome }));
      });
    }
    navigate(cancelRoute);
  };

  const onCancel = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(messages.addingGroupMembersCancelled),
        description: 'Adding members to group has been cancelled.',
      }) as any,
    );
    navigate(cancelRoute);
  };

  return (
    <Modal
      title={intl.formatMessage(messages.addMembers)}
      variant={ModalVariant.large}
      isOpen
      onClose={onCancel}
      actions={[
        <Button ouiaId="add-members-confirm" key="confirm" variant="primary" onClick={onSubmit} isDisabled={selectedUsers.length === 0}>
          {intl.formatMessage(messages.addToGroup)}
        </Button>,
        <Button ouiaId="add-members-cancel" key="cancel" variant="link" onClick={onCancel}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
    >
      <Stack hasGutter>
        <StackItem>
          <TextContent>
            <ActiveUsers {...(!isITLess && { linkDescription: intl.formatMessage(messages.toManageUsersText) })} />
          </TextContent>
        </StackItem>
        <StackItem isFilled>
          {isITLess ? (
            <UsersListItless selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} displayNarrow={true} />
          ) : (
            <UsersList selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} displayNarrow={true} />
          )}
        </StackItem>
      </Stack>
    </Modal>
  );
};
