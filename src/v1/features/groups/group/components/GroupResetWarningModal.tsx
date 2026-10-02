import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';

import { getModalContainer } from '../../../../../shared/helpers/modal-container';

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
      title={intl.formatMessage({
        id: 'restoreDefaultAccessQuestion',
        defaultMessage: 'Restore Default access group?',
        description: 'Restore Default access group question',
      })}
      confirmButtonLabel={intl.formatMessage({ id: 'continue', defaultMessage: 'Continue', description: 'Continue label' })}
      onClose={onClose}
      onConfirm={onConfirm}
      appendTo={getModalContainer()}
    >
      <FormattedMessage
        id={'restoreDefaultAccessDescription'}
        defaultMessage={
          'Restoring <b>Default access</b> group will remove <b>Custom default access</b> group. <b>Custom default access</b> configurations cannot be recovered. Are you sure?'
        }
        description={'Restore Custom Default Access group description'}
        values={{
          b: (text: React.ReactNode) => <b>{text}</b>,
        }}
      />
    </WarningModal>
  );
};
