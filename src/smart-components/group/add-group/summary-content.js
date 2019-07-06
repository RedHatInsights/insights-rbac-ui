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
  const { name, description } =
      formData.values ? formData.values : { name: '', description: '' };
  console.log('DEBUG - formData', formData);
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
              { (formData && formData.selectedUsers !== undefined) && <Grid gutter="md">
                { formData.selectedUsers.map((user)  =>
                  <Text key={ user.label }
                    className="data-table-detail content"
                    component={ TextVariants.p }>
                    { user.label }
                  </Text>) }
              </Grid> }
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

