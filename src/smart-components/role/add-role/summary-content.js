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
  Title,
} from '@patternfly/react-core';
import ResourceDefinitionsTable from './resource-definitions-table';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const SummaryContent = (formData) => {
  const intl = useIntl();
  const { application = '', description = '', name = '', permission = '', resourceType = '' } = formData;
  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h4" size="xl">
          {intl.formatMessage(messages.confirmDetails)}
        </Title>
      </StackItem>
      <StackItem>
        <Stack hasGutter>
          <StackItem>
            <TextContent>
              <Text component={TextVariants.h5}>{intl.formatMessage(messages.confirmDetailsDescription)}</Text>
            </TextContent>
          </StackItem>
          <StackItem>
            <TextContent>
              <TextList component={TextListVariants.dl}>
                <TextListItem component={TextListItemVariants.dt}>{intl.formatMessage(messages.name)}</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>{name}</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>{intl.formatMessage(messages.description)}</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>{description}</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>{intl.formatMessage(messages.application)}</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>{application}</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>{intl.formatMessage(messages.resourceType)}</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>{resourceType}</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>{intl.formatMessage(messages.operation)}</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>{permission}</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>{intl.formatMessage(messages.resourceDefinition)}</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>{new ResourceDefinitionsTable(formData)}</TextListItem>
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
  resourceType: PropTypes.string,
};

export default SummaryContent;
