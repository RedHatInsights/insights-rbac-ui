import React from 'react';
import { Grid } from '@patternfly/react-core';
import { GridItem } from '@patternfly/react-core';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const AddRolePermissionSummaryContent = () => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const {
    'role-name': name,
    'role-description': description,
    'add-permissions-table': selectedPermissions,
    'resource-definitions': resourceDefinitions,
    'has-cost-resources': hasCostResources,
  } = formOptions.getState().values;

  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Title headingLevel="h1" size="xl" className="pf-v5-u-mb-sm">
            {intl.formatMessage(messages.reviewDetails)}
          </Title>
        </TextContent>
      </StackItem>
      <StackItem className="rbac-l-stack__item-summary">
        <Grid hasGutter>
          <GridItem span={3}>
            <Text className="pf-v5-c-title" component={TextVariants.h6}>
              {intl.formatMessage(messages.roleName)}
            </Text>
          </GridItem>
          <GridItem span={9}>
            <Text component={TextVariants.p}>{name}</Text>
          </GridItem>
          <GridItem span={3}>
            <Text className="pf-v5-c-title" component={TextVariants.h6}>
              {intl.formatMessage(messages.roleDescription)}
            </Text>
          </GridItem>
          <GridItem span={9}>
            <Text component={TextVariants.p}>{description}</Text>
          </GridItem>
          <GridItem span={3}>
            <Text className="pf-v5-c-title" component={TextVariants.h6}>
              {intl.formatMessage(messages.addedPermissions)}
            </Text>
          </GridItem>
          <GridItem span={9}>
            <TextContent component={TextVariants.p}>
              {selectedPermissions.map((permission, index) => (
                <Text key={index}> {permission.uuid} </Text>
              ))}
            </TextContent>
          </GridItem>
          {hasCostResources && (
            <React.Fragment>
              <GridItem span={3}>
                <Text className="pf-v5-c-title" component={TextVariants.h6}>
                  {intl.formatMessage(messages.resourceDefinitions)}
                </Text>
              </GridItem>
              <GridItem span={9}>
                <TextContent component={TextVariants.p}>
                  {resourceDefinitions.map(({ resources }) => resources.map((resource, index) => <Text key={index}> {resource} </Text>))}
                </TextContent>
              </GridItem>
            </React.Fragment>
          )}
        </Grid>
      </StackItem>
    </Stack>
  );
};

export default AddRolePermissionSummaryContent;
