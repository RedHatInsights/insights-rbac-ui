import React from 'react';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { useIntl } from 'react-intl';
import messages from '../../../../Messages';

interface DefaultServiceAccountsAlertProps {
  isPlatformDefault: boolean;
}

/**
 * Alert displayed for default groups explaining that service accounts are not
 * automatically included in default access groups for security compliance.
 */
export const DefaultServiceAccountsAlert: React.FC<DefaultServiceAccountsAlertProps> = ({ isPlatformDefault }) => {
  const intl = useIntl();

  return (
    <Alert
      variant="info"
      isInline
      title={intl.formatMessage(isPlatformDefault ? messages.noAccountsInDefaultAccess : messages.noAccountsInDefaultAdminAccess)}
    />
  );
};
