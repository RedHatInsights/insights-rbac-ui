import React from 'react';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  allOrgAdminsAreMembers: {
    id: 'allOrgAdminsAreMembers',
    defaultMessage: 'All organization administrators in this organization are members of this group.',
    description: 'All org. admins are members of this group message',
  },
  allUsersAreMembers: {
    id: 'allUsersAreMembers',
    defaultMessage: 'All users in this organization are members of this group.',
    description: 'All users are members of this group message',
  },
});

interface DefaultMembersAlertProps {
  isAdminDefault: boolean;
}

export const DefaultMembersAlert: React.FC<DefaultMembersAlertProps> = ({ isAdminDefault }) => {
  const intl = useIntl();

  return <Alert variant="info" isInline title={intl.formatMessage(isAdminDefault ? messages.allOrgAdminsAreMembers : messages.allUsersAreMembers)} />;
};

// Keep old name as alias for backwards compatibility during migration
export const DefaultMembersCard = DefaultMembersAlert;
