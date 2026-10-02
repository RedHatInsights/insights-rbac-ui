import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { ButtonVariant } from '@patternfly/react-core/dist/dynamic/components/Button';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';

import type { Group } from '../../../../../../v2/data/queries/groups';
import { commonMessages } from '../../../../../../shared/messages/common';

const messages = defineMessages({
  deleteUserGroupModalTitle: {
    id: 'deleteUserGroupModalTitle',
    defaultMessage: 'Delete user {count, plural, one {group} other {groups}}?',
    description: 'Title for delete user group modal',
  },
  deleteUserGroupModalBody: {
    id: 'deleteUserGroupModalBody',
    defaultMessage: 'Deleting {count, plural, one {the <b>{name}</b> user group} other {{count} user groups}} will impact user access configuration.',
    description: 'Modal body text for delete user group',
  },
});

interface DeleteGroupModalProps {
  isOpen: boolean;
  groups: Group[];
  onClose: () => void;
  onConfirm: () => void;
  ouiaId?: string;
}

export const DeleteGroupModal: React.FC<DeleteGroupModalProps> = ({ isOpen, groups, onClose, onConfirm, ouiaId = 'delete-group-modal' }) => {
  const intl = useIntl();

  if (!isOpen || groups.length === 0) {
    return null;
  }

  const groupNames = groups.map((group) => group.name).join(', ');

  return (
    <WarningModal
      ouiaId={ouiaId}
      isOpen={isOpen}
      withCheckbox
      title={intl.formatMessage(messages.deleteUserGroupModalTitle, { count: groups.length })}
      confirmButtonLabel={intl.formatMessage(commonMessages.delete)}
      confirmButtonVariant={ButtonVariant.danger}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {intl.formatMessage(messages.deleteUserGroupModalBody, {
        count: groups.length,
        name: groupNames,
        b: (text: React.ReactNode) => <strong>{text}</strong>,
      })}
    </WarningModal>
  );
};
