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

const SummaryContent = (formData) => {
  const { policy } = formData.values ? formData.values : { policy: { name: '', description: '' }};
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
                  <Text className="data-table-detail heading" component={ TextVariants.h5 }>Name</Text>
                </GridItem>
                <GridItem span={ 10 }>
                  <Text className="data-table-detail content" component={ TextVariants.p }>{ policy ? policy.name : '' }</Text>
                </GridItem>
              </Grid>
              <Grid gutter="md">
                <GridItem span={ 2 }>
                  <Text className="data-table-detail heading" component={ TextVariants.h5 }>Description</Text>
                </GridItem>
                <GridItem span={ 10 }>
                  <Text className="data-table-detail content" component={ TextVariants.p }>{ policy ? policy.description : '' }</Text>
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

