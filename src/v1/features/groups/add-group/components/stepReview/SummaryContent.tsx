import React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core/dist/dynamic/components/DescriptionList';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';

import { useServiceAccountsFlag } from '../../../../../../capabilities/useServiceAccountsFlag';
import { commonMessages } from '../../../../../../shared/messages/common';

interface SummaryContentProps {
  name?: string;
  // Data-driven-forms pass-through props
  [key: string]: unknown;
}

// Types for form values
interface SelectedRole {
  uuid: string;
  name: string;
  display_name?: string;
}

interface SelectedUser {
  uuid?: string;
  username: string;
  label?: string;
}

interface SelectedServiceAccount {
  uuid?: string;
  clientId: string;
  name?: string;
}

export const SummaryContent: React.FC<SummaryContentProps> = () => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const {
    'group-name': name,
    'group-description': description,
    'users-list': selectedUsers,
    'roles-list': selectedRoles,
    'service-accounts-list': selectedServiceAccounts,
  } = formOptions.getState().values || {};
  const enableServiceAccounts = useServiceAccountsFlag();

  return (
    <Stack hasGutter>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {intl.formatMessage({ id: 'groupName', defaultMessage: 'Group name', description: 'Group name label' })}
            </DescriptionListTerm>
            <DescriptionListDescription>{name}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(commonMessages.description)}</DescriptionListTerm>
            <DescriptionListDescription>
              {description || intl.formatMessage({ id: 'none', defaultMessage: 'None', description: 'None select option text' })}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(commonMessages.roles)}</DescriptionListTerm>
            <DescriptionListDescription>
              {selectedRoles && selectedRoles.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  {selectedRoles.map((role: SelectedRole) => (
                    <li key={role.uuid}>{role.display_name || role.name}</li>
                  ))}
                </ul>
              ) : (
                <em>No roles selected</em>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(commonMessages.members)}</DescriptionListTerm>
            <DescriptionListDescription>
              {selectedUsers && selectedUsers.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  {selectedUsers.map((user: SelectedUser) => (
                    <li key={user.uuid || user.username}>{user.label || user.username}</li>
                  ))}
                </ul>
              ) : (
                <em>No members selected</em>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      {enableServiceAccounts && (
        <StackItem>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>Service accounts</DescriptionListTerm>
              <DescriptionListDescription>
                {selectedServiceAccounts && selectedServiceAccounts.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                    {selectedServiceAccounts.map((sa: SelectedServiceAccount) => (
                      <li key={sa.uuid || sa.clientId}>{sa.name || sa.clientId}</li>
                    ))}
                  </ul>
                ) : (
                  <em>No service accounts selected</em>
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </StackItem>
      )}
    </Stack>
  );
};
