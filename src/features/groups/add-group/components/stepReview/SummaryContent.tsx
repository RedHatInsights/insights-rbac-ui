import React from 'react';
import { DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, Stack, StackItem } from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';
import messages from '../../../../../Messages';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useFlag } from '@unleash/proxy-client-react';

interface SummaryContentProps {
  name?: string;
  // Data-driven-forms props
  [key: string]: any;
}

export const SummaryContent: React.FC<SummaryContentProps> = () => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const { isBeta } = useChrome();
  const {
    'group-name': name,
    'group-description': description,
    'users-list': selectedUsers,
    'roles-list': selectedRoles,
    'service-accounts-list': selectedServiceAccounts,
  } = formOptions.getState().values || {};
  const enableServiceAccounts =
    (isBeta() && useFlag('platform.rbac.group-service-accounts')) || (!isBeta() && useFlag('platform.rbac.group-service-accounts.stable'));

  return (
    <Stack hasGutter>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(messages.groupName)}</DescriptionListTerm>
            <DescriptionListDescription>{name}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(messages.description)}</DescriptionListTerm>
            <DescriptionListDescription>{description || intl.formatMessage(messages.none)}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(messages.roles)}</DescriptionListTerm>
            <DescriptionListDescription>
              {selectedRoles && selectedRoles.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  {selectedRoles.map((role: any) => (
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
            <DescriptionListTerm>{intl.formatMessage(messages.members)}</DescriptionListTerm>
            <DescriptionListDescription>
              {selectedUsers && selectedUsers.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  {selectedUsers.map((user: any) => (
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
                    {selectedServiceAccounts.map((sa: any) => (
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
