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
              <Grid>
                <GridItem md={3}>
                  <Text component={TextVariants.h4} className="ins-c-rbac__bold-text">
                    Group name
                  </Text>
                </GridItem>
                <GridItem md={9}>
                  <Text component={TextVariants.p}>{name}</Text>
                </GridItem>
              </Grid>
              <Grid>
                <GridItem md={3}>
                  <Text component={TextVariants.h4} className="ins-c-rbac__bold-text">
                    Group description
                  </Text>
                </GridItem>
                <GridItem md={9}>
                  <Text component={TextVariants.p}>{description}</Text>
                </GridItem>
              </Grid>
              <Grid>
                <GridItem md={3}>
                  <Text component={TextVariants.h4} className="ins-c-rbac__bold-text">
                    Roles
                  </Text>
                </GridItem>
                <GridItem md={9}>
                  <Text component={TextVariants.p}>
                    {selectedRoles.map((role, index) => (
                      <Text className="pf-u-mb-0" key={index}>
                        {role.label}
                      </Text>
                    ))}
                  </Text>
                </GridItem>
              </Grid>
              <Grid>
                <GridItem md={3}>
                  <Text component={TextVariants.h4} className="ins-c-rbac__bold-text">
                    Members
                  </Text>
                </GridItem>
                <GridItem md={9}>
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
