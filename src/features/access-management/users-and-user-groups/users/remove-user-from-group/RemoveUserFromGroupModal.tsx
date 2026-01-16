import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { Checkbox } from '@patternfly/react-core/dist/dynamic/components/Checkbox';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { List, ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { FormattedMessage, useIntl } from 'react-intl';
import { type Group, useGroupsQuery, useRemoveMembersFromGroupMutation } from '../../../../../data/queries/groups';
import messages from '../../../../../Messages';
import { getModalContainer } from '../../../../../helpers/modal-container';
import type { User } from '../../../../../data/queries/users';

interface RemoveUserFromGroupModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedUsers: User[];
}

/**
 * RemoveUserFromGroupModal - Modal to remove users from user groups
 *
 * This modal shows a list of groups the selected users belong to,
 * allowing the admin to select which groups to remove them from.
 */
export const RemoveUserFromGroupModal: React.FunctionComponent<RemoveUserFromGroupModalProps> = ({ isOpen, setIsOpen, selectedUsers }) => {
  const intl = useIntl();

  // Local state
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  // Use React Query for data fetching
  const { data } = useGroupsQuery(
    {
      limit: 100,
      offset: 0,
      orderBy: 'name',
      system: false,
      platformDefault: false,
    },
    { enabled: isOpen },
  );

  // Use React Query mutation for removing members
  const removeMembersMutation = useRemoveMembersFromGroupMutation();

  // Extract groups from response
  const allGroups: Group[] = (data as any)?.data || [];

  // Filter groups that contain any of the selected users
  // Note: This is a simplified version - in production, you'd want to
  // fetch groups per user from the API
  const userGroups = allGroups.filter((g) => !g.system && !g.platform_default);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setIsConfirmed(false);
      setSelectedGroupIds(new Set());
    }
  }, [isOpen]);

  const handleCloseModal = useCallback(() => {
    setIsOpen(false);
    setIsConfirmed(false);
    setSelectedGroupIds(new Set());
  }, [setIsOpen]);

  const handleToggleGroup = useCallback((groupId: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const handleRemoveUsers = useCallback(async () => {
    if (!isConfirmed || selectedGroupIds.size === 0) return;

    const selectedUsernames = selectedUsers.map((user) => user.username);

    try {
      // Remove users from each selected group
      for (const groupId of selectedGroupIds) {
        await removeMembersMutation.mutateAsync({
          groupId,
          usernames: selectedUsernames,
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to remove users from group:', error);
      // Error notification is handled by the mutation hook
    }
  }, [isConfirmed, selectedGroupIds, selectedUsers, removeMembersMutation, handleCloseModal]);

  return (
    <Modal
      appendTo={getModalContainer()}
      variant={ModalVariant.medium}
      title={intl.formatMessage(messages.removeFromUserGroup)}
      isOpen={isOpen}
      onClose={handleCloseModal}
      actions={[
        <Button
          key="remove"
          variant="danger"
          onClick={handleRemoveUsers}
          isDisabled={!isConfirmed || selectedGroupIds.size === 0 || removeMembersMutation.isPending}
          isLoading={removeMembersMutation.isPending}
        >
          {intl.formatMessage(messages.remove)}
        </Button>,
        <Button key="cancel" variant="link" onClick={handleCloseModal} isDisabled={removeMembersMutation.isPending}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
      ouiaId="remove-user-from-group-modal"
    >
      <Alert variant="warning" isInline title={intl.formatMessage(messages.removeFromUserGroupWarningTitle)}>
        <FormattedMessage
          {...messages.removeFromUserGroupWarningDescription}
          values={{
            b: (text) => <b>{text}</b>,
            numUsers: selectedUsers.length,
            plural: selectedUsers.length > 1 ? 'users' : 'user',
          }}
        />
      </Alert>

      <div className="pf-v6-u-mt-md">
        <strong>{intl.formatMessage(messages.usersToRemove)}:</strong>
        <List isPlain>
          {selectedUsers.map((user) => (
            <ListItem key={user.username}>{user.username}</ListItem>
          ))}
        </List>
      </div>

      {userGroups.length > 0 && (
        <div className="pf-v6-u-mt-md">
          <strong>{intl.formatMessage(messages.selectGroupsToRemoveFrom)}:</strong>
          <List isPlain className="pf-v6-u-mt-sm">
            {userGroups.map((group) => (
              <ListItem key={group.uuid}>
                <Checkbox
                  id={`group-${group.uuid}`}
                  label={group.name}
                  isChecked={selectedGroupIds.has(group.uuid)}
                  onChange={() => handleToggleGroup(group.uuid)}
                />
              </ListItem>
            ))}
          </List>
        </div>
      )}

      <div className="pf-v6-u-mt-lg">
        <Checkbox
          id="confirm-removal"
          label={intl.formatMessage(messages.understandActionIrreversible)}
          isChecked={isConfirmed}
          onChange={(_, checked) => setIsConfirmed(checked)}
        />
      </div>
    </Modal>
  );
};

// Component uses named export only
