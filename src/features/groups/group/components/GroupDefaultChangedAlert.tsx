import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import messages from '../../../../Messages';

interface GroupDefaultChangedAlertProps {
  /**
   * Whether the alert should be visible
   */
  isVisible: boolean;

  /**
   * Handler for closing the alert
   */
  onClose: () => void;
}

/**
 * Alert component for showing default group change information
 * Displays when a default group's configuration has been modified
 */
export const GroupDefaultChangedAlert: React.FC<GroupDefaultChangedAlertProps> = ({ isVisible, onClose }) => {
  const intl = useIntl();

  if (!isVisible) {
    return null;
  }

  return (
    <Alert
      variant="info"
      isInline
      title={intl.formatMessage(messages.defaultAccessGroupChanged)}
      actionClose={<AlertActionCloseButton onClose={onClose} />}
      className="pf-v5-u-mb-lg pf-v5-u-mt-sm"
    >
      <FormattedMessage
        {...messages.defaultAccessGroupNameChanged}
        values={{
          b: (text: React.ReactNode) => <b>{text}</b>,
        }}
      />
    </Alert>
  );
};
