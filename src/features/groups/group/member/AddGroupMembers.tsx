import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { useFlag } from '@unleash/proxy-client-react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';

import { useAddMembersToGroupMutation, useGroupQuery } from '../../../../data/queries/groups';
import { UsersList } from '../../add-group/components/stepUsers/UsersList';
import { ActiveUsers } from '../../../../components/user-management/ActiveUsers';
import { DefaultGroupChangeModal } from '../../components/DefaultGroupChangeModal';
import { getModalContainer } from '../../../../helpers/modal-container';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import messages from '../../../../Messages';
import type { AddGroupMembersProps } from './types';

export const AddGroupMembers: React.FC<AddGroupMembersProps> = ({
  cancelRoute,
  isDefault,
  isChanged,
  onDefaultGroupChanged,
  fetchUuid,
  groupName: name,
}) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { groupId: uuid } = useParams<{ groupId: string }>();
  const isITLess = useFlag('platform.rbac.itless');
  const addNotification = useAddNotification();

  const [selectedUsers, setSelectedUsers] = useState<Array<{ username: string; uuid?: string }>>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Use fetchUuid for default groups, otherwise use route param
  const groupId = isDefault && fetchUuid ? fetchUuid : uuid;

  // Fetch group data via React Query (only if name not provided)
  useGroupQuery(groupId ?? '', { enabled: !name && !!groupId });

  // Add members mutation - handles notifications and cache invalidation automatically
  const addMembersMutation = useAddMembersToGroupMutation();

  const onSubmit = () => {
    // If this is a default group that hasn't been changed yet, show confirmation modal
    if (isDefault && !isChanged) {
      setShowConfirmModal(true);
      return;
    }

    handleAddMembers();
  };

  const handleAddMembers = async () => {
    const usernames = selectedUsers.map((user) => user.username).filter(Boolean);
    if (usernames.length > 0 && groupId) {
      addNotification({
        variant: 'info',
        title: intl.formatMessage(usernames.length > 1 ? messages.addingGroupMembersTitle : messages.addingGroupMemberTitle),
        description: intl.formatMessage(usernames.length > 1 ? messages.addingGroupMembersDescription : messages.addingGroupMemberDescription),
      });

      try {
        await addMembersMutation.mutateAsync({ groupId, usernames });
        // Success notification is handled by the mutation
      } catch (error) {
        // Error notification is handled by the mutation
        console.error('Failed to add members to group:', error);
      }
    }
    navigate(cancelRoute);
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    // Show the alert that the default group has been changed
    if (onDefaultGroupChanged) {
      onDefaultGroupChanged(true);
    }
    handleAddMembers();
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: intl.formatMessage(messages.addingGroupMembersCancelled),
      description: 'Adding members to group has been cancelled.',
    });
    navigate(cancelRoute);
  };

  return (
    <>
      <Modal
        title={intl.formatMessage(messages.addMembers)}
        variant={ModalVariant.large}
        isOpen
        onClose={onCancel}
        appendTo={getModalContainer()}
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
            <Content>
              <ActiveUsers {...(!isITLess && { linkDescription: intl.formatMessage(messages.toManageUsersText) })} />
            </Content>
          </StackItem>
          <StackItem isFilled>
            {isITLess ? (
              <UsersList initialSelectedUsers={selectedUsers} onSelect={setSelectedUsers} displayNarrow={true} />
            ) : (
              <UsersList initialSelectedUsers={selectedUsers} onSelect={setSelectedUsers} displayNarrow={true} />
            )}
          </StackItem>
        </Stack>
      </Modal>

      <DefaultGroupChangeModal isOpen={showConfirmModal} onSubmit={handleConfirm} onClose={() => setShowConfirmModal(false)} />
    </>
  );
};

export default AddGroupMembers;
