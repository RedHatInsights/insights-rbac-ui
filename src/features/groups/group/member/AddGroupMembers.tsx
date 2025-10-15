import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useFlag } from '@unleash/proxy-client-react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { ModalVariant } from '@patternfly/react-core';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { addMembersToGroup, fetchGroup, fetchGroups, fetchMembersForGroup, invalidateSystemGroup } from '../../../../redux/groups/actions';
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
  afterSubmit,
}) => {
  const chrome = useChrome();
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { groupId: uuid } = useParams<{ groupId: string }>();
  const dispatch = useDispatch();
  const isITLess = useFlag('platform.rbac.itless');

  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Use fetchUuid for default groups, otherwise use route param
  const groupId = isDefault && fetchUuid ? fetchUuid : uuid;

  useEffect(() => {
    if (!name && groupId) {
      dispatch(fetchGroup(groupId));
    }
  }, [name, groupId, dispatch]);

  const onSubmit = () => {
    // If this is a default group that hasn't been changed yet, show confirmation modal
    if (isDefault && !isChanged) {
      setShowConfirmModal(true);
      return;
    }

    handleAddMembers();
  };

  const handleAddMembers = () => {
    const userList = selectedUsers.map((user) => ({ username: user.username || user.label }));
    if (userList.length > 0) {
      dispatch(
        addNotification({
          variant: 'info',
          title: intl.formatMessage(userList.length > 1 ? messages.addingGroupMembersTitle : messages.addingGroupMemberTitle),
          description: intl.formatMessage(userList.length > 1 ? messages.addingGroupMembersDescription : messages.addingGroupMemberDescription),
        }) as any,
      );
      (dispatch(addMembersToGroup(groupId!, userList)) as any).then(() => {
        // If we just modified a default group, re-fetch to get the updated name
        if (isDefault && !isChanged) {
          dispatch(fetchGroup(groupId!));
        }
        dispatch(fetchMembersForGroup(groupId!));
        dispatch(fetchGroups({ usesMetaInURL: true, chrome }));
        afterSubmit && afterSubmit();
      });
    }
    navigate(cancelRoute);
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    dispatch(invalidateSystemGroup());
    // Show the alert that the default group has been changed
    if (onDefaultGroupChanged) {
      onDefaultGroupChanged(true);
    }
    handleAddMembers();
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
            <TextContent>
              <ActiveUsers {...(!isITLess && { linkDescription: intl.formatMessage(messages.toManageUsersText) })} />
            </TextContent>
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
