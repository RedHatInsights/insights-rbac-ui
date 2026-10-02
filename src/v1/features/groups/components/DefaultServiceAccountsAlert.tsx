import React from 'react';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  noAccountsInDefaultAccess: {
    id: 'noAccountsInDefaultAccess',
    defaultMessage:
      'In adherence to security guidelines, service accounts are not automatically included in the default access group. To grant access, it is necessary to manually add them to the appropriate user access groups.',
    description: 'No service accounts for Default Access group message',
  },
  noAccountsInDefaultAdminAccess: {
    id: 'noAccountsInDefaultAdminAccess',
    defaultMessage:
      'In adherence to security guidelines, service accounts are not automatically included in the default admin access group. To grant access, it is necessary to manually add them to the appropriate user access groups.',
    description: 'No service accounts for Default Admin Access group message',
  },
});

interface DefaultServiceAccountsAlertProps {
  isPlatformDefault: boolean;
}

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
