import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  GridItem,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  Title
} from '@patternfly/react-core';

import {  } from '@patternfly/react-core';

const SummaryContent = (formData) => {
  const { name, description, policy } =
      formData.values ? formData.values : { name: '', description: '', policy: { name: '' }};
  const selectedUsers = formData.selectedUsers ? formData.selectedUsers : [];
  const selectedRoles = formData.selectedRoles ? formData.selectedRoles : [];
  return (
    <Fragment>
      <Stack gutter="md">
        <StackItem>
          <Title size="xl"> Review </Title>
        </StackItem>
        <StackItem>
          <Stack gutter="md">
            <StackItem>
              <TextContent>
                <Text className="data-table-detail heading" component={ TextVariants.h5 }>
                Review and confirm your inputs. If there is anything incorrect, click Back and revise.</Text>
              </TextContent>
            </StackItem>
            <StackItem>
              <Grid gutter="md">
                <GridItem span={ 2 }>
                  <Text className="data-table-detail heading" component={ TextVariants.h5 }>Group name</Text>
                </GridItem>
                <GridItem span={ 10 }>
                  <Text className="data-table-detail content" component={ TextVariants.p }>{ name }</Text>
                </GridItem>
              </Grid>
              <Grid gutter="md">
                <GridItem span = { 2 }>
                  <Text className="data-table-detail heading" component={ TextVariants.h5 }>Description</Text>
                </GridItem>
                <GridItem span = { 10 }>
                  <Text className="data-table-detail content" component={ TextVariants.p }>{ description }</Text>
                </GridItem>
              </Grid>
              <Grid gutter="md">
                <GridItem span = { 2 }>
                  <Text className="data-table-detail heading" component={ TextVariants.h5 }>Members</Text>
                </GridItem>
                <GridItem span= { 10 }>
                  <Text
                    className="groups-table-detail content"
                    component={ TextVariants.h5 }>
                    { `${selectedUsers.map((user, index) => `${index !== 0 ? ' ' : ''}${user.label}`)}` }
                  </Text>
                </GridItem>
              </Grid>
              <Grid gutter="md">
                <GridItem span={ 2 }>
                  <Text className="data-table-detail heading" component={ TextVariants.h5 }>Policy name</Text>
                </GridItem>
                <GridItem span={ 10 }>
                  <Text className="data-table-detail content" component={ TextVariants.p }>{ policy ? policy.name : '' }</Text>
                </GridItem>
              </Grid>
              <Grid gutter="md">
                <GridItem span = { 2 }>
                  <Text className="data-table-detail heading" component={ TextVariants.h5 }>Roles</Text>
                </GridItem>
                <GridItem span= { 10 }>
                  <Text
                    className="groups-table-detail content"
                    component={ TextVariants.h5 }>
                    { `${selectedRoles.map((role, index) => `${index !== 0 ? ' ' : ''}${role.label}`)}` }
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
  groups: PropTypes.array
};

export default SummaryContent;

