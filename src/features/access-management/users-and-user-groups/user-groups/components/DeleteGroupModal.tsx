import React from 'react';
import { useIntl } from 'react-intl';
import { ButtonVariant } from '@patternfly/react-core';
import { WarningModal } from '@patternfly/react-component-groups';
import messages from '../../../../../Messages';
import type { Group } from '../../../../../data/queries/groups';

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

  const isMultiple = groups.length > 1;
  const groupNames = groups.map((group) => group.name).join(', ');

  return (
    <WarningModal
      ouiaId={ouiaId}
      isOpen={isOpen}
      title={intl.formatMessage(isMultiple ? messages.deleteUserGroupModalTitle : messages.deleteUserGroupModalTitle, { count: groups.length })}
      confirmButtonLabel={intl.formatMessage(messages.delete)}
      confirmButtonVariant={ButtonVariant.danger}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {intl.formatMessage(isMultiple ? messages.deleteUserGroupModalBody : messages.deleteUserGroupModalBody, {
        count: groups.length,
        name: groupNames,
        b: (text: React.ReactNode) => <strong>{text}</strong>,
      })}
    </WarningModal>
  );
};
