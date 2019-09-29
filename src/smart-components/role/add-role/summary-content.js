import React from 'react';
import PropTypes from 'prop-types';
import {
  Stack,
  StackItem,
  Text,
  TextContent,
  TextList,
  TextListItem,
  TextListItemVariants,
  TextListVariants,
  TextVariants,
  Title
} from '@patternfly/react-core';
import ResourceDefinitionsTable from './resource-definitions-table';

const SummaryContent = (formData) => {
  const {
    application = '',
    description = '',
    name = '',
    permission = '',
    resourceType = ''
  } = formData;

  return (
    <Stack gutter="md">
      <StackItem>
        <Title size="xl">Confirm details</Title>
      </StackItem>
      <StackItem>
        <Stack gutter="md">
          <StackItem>
            <TextContent>
              <Text component={ TextVariants.h5 }>
                  Confirm the details for your source, or click Back to revise
              </Text>
            </TextContent>
          </StackItem>
          <StackItem>
            <TextContent>
              <TextList component={ TextListVariants.dl }>
                <TextListItem component={ TextListItemVariants.dt }>Name</TextListItem>
                <TextListItem component={ TextListItemVariants.dd }>{ name }</TextListItem>
                <TextListItem component={ TextListItemVariants.dt }>Description</TextListItem>
                <TextListItem component={ TextListItemVariants.dd }>{ description }</TextListItem>
                <TextListItem component={ TextListItemVariants.dt }>Application</TextListItem>
                <TextListItem component={ TextListItemVariants.dd }>{ application }</TextListItem>
                <TextListItem component={ TextListItemVariants.dt }>Resource type</TextListItem>
                <TextListItem component={ TextListItemVariants.dd }>{ resourceType }</TextListItem>
                <TextListItem component={ TextListItemVariants.dt }>Operation</TextListItem>
                <TextListItem component={ TextListItemVariants.dd }>{ permission }</TextListItem>
                <TextListItem component={ TextListItemVariants.dt }>Resource definition</TextListItem>
                <TextListItem component={ TextListItemVariants.dd }>
                  { new ResourceDefinitionsTable(formData) }
                </TextListItem>
              </TextList>
            </TextContent>
          </StackItem>
        </Stack>
      </StackItem>
    </Stack>
  );
};

SummaryContent.propTypes = {
  application: PropTypes.string,
  description: PropTypes.string,
  name: PropTypes.string,
  permission: PropTypes.string,
  resourceType: PropTypes.string
};

export default SummaryContent;

