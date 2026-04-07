import React from 'react';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { useIntl } from 'react-intl';
import messages from '../../../../Messages';

interface DefaultMembersAlertProps {
  isAdminDefault: boolean;
}

/**
 * Alert displayed for default groups indicating that all users (or all org admins)
 * are automatically members of this group.
 */
export const DefaultMembersAlert: React.FC<DefaultMembersAlertProps> = ({ isAdminDefault }) => {
  const intl = useIntl();

  return <Alert variant="info" isInline title={intl.formatMessage(isAdminDefault ? messages.allOrgAdminsAreMembers : messages.allUsersAreMembers)} />;
};
