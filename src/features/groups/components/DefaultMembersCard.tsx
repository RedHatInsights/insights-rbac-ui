import React from 'react';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

interface DefaultMembersAlertProps {
  isAdminDefault: boolean;
}

export const DefaultMembersAlert: React.FC<DefaultMembersAlertProps> = ({ isAdminDefault }) => {
  const intl = useIntl();

  return <Alert variant="info" isInline title={intl.formatMessage(isAdminDefault ? messages.allOrgAdminsAreMembers : messages.allUsersAreMembers)} />;
};

// Keep old name as alias for backwards compatibility during migration
export const DefaultMembersCard = DefaultMembersAlert;
