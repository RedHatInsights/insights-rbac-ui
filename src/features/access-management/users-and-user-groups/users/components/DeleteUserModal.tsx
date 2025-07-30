import React from 'react';
import { useIntl } from 'react-intl';
import { ButtonVariant } from '@patternfly/react-core';
import { WarningModal } from '@patternfly/react-component-groups';
import messages from '../../../../../Messages';

interface DeleteUserModalProps {
  isOpen: boolean;
  username?: string;
  onClose: () => void;
  onConfirm: () => void;
  ouiaId?: string;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ isOpen, username, onClose, onConfirm, ouiaId = 'delete-user-modal' }) => {
  const intl = useIntl();

  if (!username) {
    return null;
  }

  return (
    <WarningModal
      ouiaId={ouiaId}
      isOpen={isOpen}
      title={intl.formatMessage(messages.deleteUserModalTitle)}
      confirmButtonLabel={intl.formatMessage(messages.remove)}
      confirmButtonVariant={ButtonVariant.danger}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {`${username} ${intl.formatMessage(messages.deleteUserModalBody)}`}
    </WarningModal>
  );
};
