import React from 'react';
import PropTypes from 'prop-types';
import { Grid, GridItem, Stack, StackItem, Text, TextVariants } from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';

const SummaryContent = () => {
  const formOptions = useFormApi();
  const {
    'group-name': name,
    'group-description': description,
    'users-list': selectedUsers,
    'roles-list': selectedRoles,
  } = formOptions.getState().values;

  return (
    <div className="rbac">
      <Stack hasGutter>
        <StackItem>
          <Stack hasGutter>
            <StackItem className="rbac-c-summary">
              <Grid>
                <GridItem md={3}>
                  <Text component={TextVariants.h4} className="rbac-bold-text">
                    Group name
                  </Text>
                </GridItem>
                <GridItem md={9}>
                  <Text component={TextVariants.p}>{name}</Text>
                </GridItem>
              </Grid>
              <Grid>
                <GridItem md={3}>
                  <Text component={TextVariants.h4} className="rbac-bold-text">
                    Group description
                  </Text>
                </GridItem>
                <GridItem md={9}>
                  <Text component={TextVariants.p}>{description}</Text>
                </GridItem>
              </Grid>
              <Grid>
                <GridItem md={3}>
                  <Text component={TextVariants.h4} className="rbac-bold-text">
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
                  <Text component={TextVariants.h4} className="rbac-bold-text">
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
    </div>
  );
};

SummaryContent.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
  groups: PropTypes.array,
};

export default SummaryContent;
