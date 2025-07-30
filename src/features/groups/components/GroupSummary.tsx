import React from 'react';
import { Grid, GridItem, Stack, StackItem, Text, TextVariants } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

interface Role {
  label: string;
}

interface User {
  label: string;
}

interface ServiceAccount {
  name: string;
}

interface GroupSummaryProps {
  name: string;
  description?: string;
  selectedRoles?: Role[];
  selectedUsers: User[];
  selectedServiceAccounts?: ServiceAccount[];
  showServiceAccounts?: boolean;
}

export const GroupSummary: React.FC<GroupSummaryProps> = ({
  name,
  description,
  selectedRoles,
  selectedUsers,
  selectedServiceAccounts,
  showServiceAccounts = false,
}) => {
  const intl = useIntl();

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
                    {intl.formatMessage(messages.groupDescription)}
                  </Text>
                </GridItem>
                <GridItem md={9}>
                  <Text component={TextVariants.p}>{description}</Text>
                </GridItem>
              </Grid>
              {selectedRoles && (
                <Grid>
                  <GridItem md={3}>
                    <Text component={TextVariants.h4} className="rbac-bold-text">
                      {intl.formatMessage(messages.roles)}
                    </Text>
                  </GridItem>
                  <GridItem md={9}>
                    {selectedRoles.map((role, index) => (
                      <Text className="pf-v5-u-mb-0" key={index}>
                        {role.label}
                      </Text>
                    ))}
                  </GridItem>
                </Grid>
              )}
              <Grid>
                <GridItem md={3}>
                  <Text component={TextVariants.h4} className="rbac-bold-text">
                    {intl.formatMessage(messages.members)}
                  </Text>
                </GridItem>
                <GridItem md={9}>
                  {selectedUsers.map((user, index) => (
                    <Text className="pf-v5-u-mb-0" key={index}>
                      {user.label}
                    </Text>
                  ))}
                </GridItem>
              </Grid>
              {showServiceAccounts && (
                <Grid>
                  <GridItem md={3}>
                    <Text component={TextVariants.h4} className="rbac-bold-text">
                      {intl.formatMessage(messages.serviceAccounts)}
                    </Text>
                  </GridItem>
                  <GridItem md={9}>
                    {selectedServiceAccounts?.map((account, index) => (
                      <Text className="pf-v5-u-mb-0" key={index}>
                        {account.name}
                      </Text>
                    ))}
                  </GridItem>
                </Grid>
              )}
            </StackItem>
          </Stack>
        </StackItem>
      </Stack>
    </div>
  );
};
