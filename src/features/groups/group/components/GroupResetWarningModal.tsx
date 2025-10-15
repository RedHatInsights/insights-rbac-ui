import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import messages from '../../../../Messages';
import { getModalContainer } from '../../../../helpers/modal-container';

interface GroupResetWarningModalProps {
  /**
   * Whether the modal is visible
   */
  isOpen: boolean;

  /**
   * Handler for closing the modal
   */
  onClose: () => void;

  /**
   * Handler for confirming the reset action
   */
  onConfirm: () => void;
}

/**
 * Modal component for confirming default group reset actions
 * Shows warning message and handles user confirmation
 */
export const GroupResetWarningModal: React.FC<GroupResetWarningModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const intl = useIntl();

  if (!isOpen) {
    return null;
  }

  return (
    <WarningModal
      isOpen={isOpen}
      title={intl.formatMessage(messages.restoreDefaultAccessQuestion)}
      confirmButtonLabel={intl.formatMessage(messages.continue)}
      onClose={onClose}
      onConfirm={onConfirm}
      appendTo={getModalContainer()}
    >
      <FormattedMessage
        {...messages.restoreDefaultAccessDescription}
        values={{
          b: (text: React.ReactNode) => <b>{text}</b>,
        }}
      />
    </WarningModal>
  );
};
