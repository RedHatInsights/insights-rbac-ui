import React from 'react';
import PropTypes from 'prop-types';
import { Grid, GridItem, Stack, StackItem, Text, TextContent, TextVariants, Title } from '@patternfly/react-core';

const AddRolePermissionSummaryContent = ({ selectedPermissions = [], role = {} }) => {
  const { display_name: name, description } = role;

  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Title headingLevel="h4" size="xl">
            Review Details
          </Title>
        </TextContent>
      </StackItem>
      <StackItem classnem="ins-c-rbac__summary">
        <Grid hasGutter>
          <GridItem span={3}>
            <Text className="pf-c-title" component={TextVariants.h6}>
              Role Name:
            </Text>
          </GridItem>
          <GridItem span={9}>
            <Text component={TextVariants.p}>{name}</Text>
          </GridItem>
          <GridItem span={3}>
            <Text className="pf-c-title" component={TextVariants.h6}>
              Role Description:
            </Text>
          </GridItem>
          <GridItem span={9}>
            <Text component={TextVariants.p}>{description}</Text>
          </GridItem>
          <GridItem span={3}>
            <Text className="pf-c-title" component={TextVariants.h6}>
              Adding Permissions:
            </Text>
          </GridItem>
          <GridItem span={9}>
            <Text component={TextVariants.p}>
              {selectedPermissions.map((permission, index) => (
                <Text key={index}> {permission.uuid} </Text>
              ))}
            </Text>
          </GridItem>
        </Grid>
      </StackItem>
    </Stack>
  );
};

AddRolePermissionSummaryContent.propTypes = {
  role: PropTypes.shape,
  selectedPermissions: PropTypes.array,
};

export default AddRolePermissionSummaryContent;
