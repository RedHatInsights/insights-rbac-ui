import React from 'react';
import { Grid } from '@patternfly/react-core';
import { GridItem } from '@patternfly/react-core';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
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
    <div className="rbac">
      <Stack hasGutter>
        <StackItem>
          <Stack hasGutter>
            <StackItem className="rbac-l-stack__item-summary">
              <Grid>
                <GridItem md={3}>
                  <Text component={TextVariants.h4} className="rbac-bold-text">
                    {intl.formatMessage(messages.groupName)}
                  </Text>
                </GridItem>
                <GridItem md={9}>
                  <Text component={TextVariants.p}>{name}</Text>
                </GridItem>
              </Grid>
              <Grid>
                <GridItem md={3}>
                  <Text component={TextVariants.h4} className="rbac-bold-text">
                    {intl.formatMessage(messages.description)}
                  </Text>
                </GridItem>
                <GridItem md={9}>
                  <Text component={TextVariants.p}>{description || intl.formatMessage(messages.none)}</Text>
                </GridItem>
              </Grid>
            </StackItem>
            <StackItem className="rbac-l-stack__item-summary">
              <Grid>
                <GridItem md={3}>
                  <Text component={TextVariants.h4} className="rbac-bold-text">
                    {intl.formatMessage(messages.roles)}
                  </Text>
                </GridItem>
                <GridItem md={9}>
                  <Stack>
                    {selectedRoles && selectedRoles.length > 0 ? (
                      selectedRoles.map((role: any) => (
                        <StackItem key={role.uuid}>
                          <Text component={TextVariants.p}>{role.display_name || role.name}</Text>
                        </StackItem>
                      ))
                    ) : (
                      <StackItem>
                        <Text component={TextVariants.p}>{'No roles selected'}</Text>
                      </StackItem>
                    )}
                  </Stack>
                </GridItem>
              </Grid>
            </StackItem>
            <StackItem className="rbac-l-stack__item-summary">
              <Grid>
                <GridItem md={3}>
                  <Text component={TextVariants.h4} className="rbac-bold-text">
                    {intl.formatMessage(messages.members)}
                  </Text>
                </GridItem>
                <GridItem md={9}>
                  <Stack>
                    {selectedUsers && selectedUsers.length > 0 ? (
                      selectedUsers.map((user: any) => (
                        <StackItem key={user.uuid || user.username}>
                          <Text component={TextVariants.p}>{user.label || user.username}</Text>
                        </StackItem>
                      ))
                    ) : (
                      <StackItem>
                        <Text component={TextVariants.p}>{'No members selected'}</Text>
                      </StackItem>
                    )}
                  </Stack>
                </GridItem>
              </Grid>
            </StackItem>
            {enableServiceAccounts && (
              <StackItem className="rbac-l-stack__item-summary">
                <Grid>
                  <GridItem md={3}>
                    <Text component={TextVariants.h4} className="rbac-bold-text">
                      Service accounts
                    </Text>
                  </GridItem>
                  <GridItem md={9}>
                    <Stack>
                      {selectedServiceAccounts && selectedServiceAccounts.length > 0 ? (
                        selectedServiceAccounts.map((sa: any) => (
                          <StackItem key={sa.uuid || sa.clientId}>
                            <Text component={TextVariants.p}>{sa.name || sa.clientId}</Text>
                          </StackItem>
                        ))
                      ) : (
                        <StackItem>
                          <Text component={TextVariants.p}>{'No service accounts selected'}</Text>
                        </StackItem>
                      )}
                    </Stack>
                  </GridItem>
                </Grid>
              </StackItem>
            )}
          </Stack>
        </StackItem>
      </Stack>
    </div>
  );
};
