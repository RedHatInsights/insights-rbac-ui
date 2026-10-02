import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';

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
      title={intl.formatMessage({
        id: 'defaultAccessGroupChanged',
        defaultMessage: 'Default access group has changed',
        description: 'Default access group changed message',
      })}
      actionClose={<AlertActionCloseButton onClose={onClose} />}
      className="pf-v6-u-mb-lg pf-v6-u-mt-sm"
    >
      <FormattedMessage
        id={'defaultAccessGroupNameChanged'}
        defaultMessage={
          'Now that you have edited the <b>Default access</b> group, the system will no longer update it with new default access roles. The group name has changed to <b>Custom default access</b>.'
        }
        description={'Default access group renamed message'}
        values={{
          b: (text: React.ReactNode) => <b>{text}</b>,
        }}
      />
    </Alert>
  );
};
