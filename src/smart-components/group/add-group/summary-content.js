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
  const { name, description } =
      formData.values ? formData.values : { name: '', description: '' };
  const selectedUsers = formData.selectedUsers ? formData.selectedUsers : [];
  const selectedRoles = formData.selectedRoles ? formData.selectedRoles : [];
  return (
    <Fragment>
      <Stack hasGutter>
        <StackItem>
          <Stack hasGutter>
            <StackItem>
              <TextContent>
                <Title headingLevel="h4" size="xl"> Confirm the details for this group, or click Back to revise </Title>
              </TextContent>
            </StackItem>
            <StackItem className="ins-c-rbac__summary">
              <Grid hasGutter>
                <GridItem span={ 2 }>
                  <Text className="data-table-detail heading content" component={ TextVariants.h5 }>Group name</Text>
                </GridItem>
                <GridItem span={ 10 }>
                  <Text className="data-table-detail content content" component={ TextVariants.p }>{ name }</Text>
                </GridItem>
              </Grid>
              <Grid hasGutter>
                <GridItem span = { 2 }>
                  <Text className="data-table-detail heading content" component={ TextVariants.h5 }>Group description</Text>
                </GridItem>
                <GridItem span = { 10 }>
                  <Text className="data-table-detail content content" component={ TextVariants.p }>{ description }</Text>
                </GridItem>
              </Grid>
              <Grid hasGutter>
                <GridItem span={ 2 }>
                  <Text className="data-table-detail heading content" component={ TextVariants.h5 }>Role(s)</Text>
                </GridItem>
                <GridItem span={ 10 }>
                  <Text
                    className="groups-table-detail content"
                    component={ TextVariants.h5 }>
                    {selectedRoles.map((role, index) => <Text className="pf-u-mb-0" key={ index }>{role.label}</Text>)}
                  </Text>
                </GridItem>
              </Grid>
              <Grid hasGutter>
                <GridItem span = { 2 }>
                  <Text className="data-table-detail heading content" component={ TextVariants.h5 }>Member(s)</Text>
                </GridItem>
                <GridItem span= { 10 }>
                  <Text
                    className="groups-table-detail content"
                    component={ TextVariants.h5 }>
                    { selectedUsers.map((role, index) => <Text className="pf-u-mb-0" key={ index }>{ role.label }</Text>) }
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

