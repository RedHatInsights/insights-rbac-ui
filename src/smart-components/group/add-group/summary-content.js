import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Grid, GridItem, Stack, StackItem, Text, TextContent, TextVariants, Title } from '@patternfly/react-core';

const SummaryContent = (formData) => {
  const { name, description } = formData.values ? formData.values : { name: '', description: '' };
  const selectedUsers = formData.selectedUsers ? formData.selectedUsers : [];
  const selectedRoles = formData.selectedRoles ? formData.selectedRoles : [];
  return (
    <Fragment>
      <Stack hasGutter>
        <StackItem>
          <Stack hasGutter>
            <StackItem>
              <TextContent>
                <Title headingLevel="h4" size="xl">
                  Review details
                </Title>
              </TextContent>
            </StackItem>
            <StackItem className="ins-c-rbac__summary">
              <Grid hasGutter>
                <GridItem span={3}>
                  <Text className="pf-c-title" component={TextVariants.h6}>
                    Group name
                  </Text>
                </GridItem>
                <GridItem span={9}>
                  <Text component={TextVariants.p}>{name}</Text>
                </GridItem>
              </Grid>
              <Grid hasGutter>
                <GridItem span={3}>
                  <Text className="pf-c-title" component={TextVariants.h6}>
                    Group description
                  </Text>
                </GridItem>
                <GridItem span={9}>
                  <Text component={TextVariants.p}>{description}</Text>
                </GridItem>
              </Grid>
              <Grid hasGutter>
                <GridItem span={3}>
                  <Text className="pf-c-title" component={TextVariants.h6}>
                    Roles
                  </Text>
                </GridItem>
                <GridItem span={9}>
                  <Text component={TextVariants.p}>
                    {selectedRoles.map((role, index) => (
                      <Text className="pf-u-mb-0" key={index}>
                        {role.label}
                      </Text>
                    ))}
                  </Text>
                </GridItem>
              </Grid>
              <Grid hasGutter>
                <GridItem span={3}>
                  <Text className="pf-c-title" component={TextVariants.h6}>
                    Members
                  </Text>
                </GridItem>
                <GridItem span={9}>
                  <Text component={TextVariants.p}>
                    {selectedUsers.map((role, index) => (
                      <Text className="pf-u-mb-0" key={index}>
                        {role.label}
                      </Text>
                    ))}
                  </Text>
                </GridItem>
              </Grid>
            </StackItem>
          </Stack>
        </StackItem>
      </Stack>
    </Fragment>
  );
};

SummaryContent.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
  groups: PropTypes.array,
};

export default SummaryContent;
