import React from 'react';
import { Grid, GridItem, Stack, StackItem, Text, TextContent, TextVariants, Title } from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/esm/use-form-api';

const AddRolePermissionSummaryContent = () => {
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
          <Title headingLevel="h1" size="xl" className="ins-c-rbac__gutter-sm">
            Review details
          </Title>
        </TextContent>
      </StackItem>
      <StackItem classnem="ins-c-rbac__summary">
        <Grid hasGutter>
          <GridItem span={3}>
            <Text className="pf-c-title" component={TextVariants.h6}>
              Role name:
            </Text>
          </GridItem>
          <GridItem span={9}>
            <Text component={TextVariants.p}>{name}</Text>
          </GridItem>
          <GridItem span={3}>
            <Text className="pf-c-title" component={TextVariants.h6}>
              Role description:
            </Text>
          </GridItem>
          <GridItem span={9}>
            <Text component={TextVariants.p}>{description}</Text>
          </GridItem>
          <GridItem span={3}>
            <Text className="pf-c-title" component={TextVariants.h6}>
              Adding permissions:
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
                <Text className="pf-c-title" component={TextVariants.h6}>
                  Resource definitions:
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
