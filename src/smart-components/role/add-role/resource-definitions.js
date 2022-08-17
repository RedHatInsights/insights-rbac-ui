import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Form, FormGroup, Stack, StackItem, Text, TextContent, TextInput, TextVariants, Title } from '@patternfly/react-core';
import ResourceDefinitionsTable from './resource-definitions-table';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const ResourceDefinitions = (formData, handleChange) => {
  const intl = useIntl();
  // The current resource definition defined in the page
  const [resourceDefinition, setResourceDefinition] = useState({
    key: '',
    operation: '',
    value: '',
  });
  const { resourceDefinitions = [] } = formData;

  const hasDuplicates = () => {
    let result = false;
    for (let i = 0; i < resourceDefinitions.length; i++) {
      const definition = resourceDefinitions[i];
      if (
        definition.key === resourceDefinition.key &&
        definition.operation === resourceDefinition.operation &&
        definition.value === resourceDefinition.value
      ) {
        result = true;
        break;
      }
    }

    return result;
  };

  // Disable "Add to definitions" button if any field is empty
  let isFormValid =
    !hasDuplicates() &&
    resourceDefinition.key.trim().length > 0 &&
    resourceDefinition.operation.trim().length > 0 &&
    resourceDefinition.value.trim().length > 0;

  // Add the current resource definition
  const addDefinition = () => {
    // Omit duplicates
    if (hasDuplicates()) {
      return;
    }

    const definitions = [...resourceDefinitions, resourceDefinition];
    handleChange({ resourceDefinitions: definitions });
  };

  const removeDefinition = (resourceDefinition) => {
    const definitions = [];
    for (let i = 0; i < resourceDefinitions.length; i++) {
      const definition = resourceDefinitions[i];
      if (
        definition.key === resourceDefinition.key &&
        definition.operation === resourceDefinition.operation &&
        definition.value === resourceDefinition.value
      ) {
        continue;
      }

      definitions.push(definition);
    }

    handleChange({ resourceDefinitions: definitions });
  };

  const updateDefinition = (values) => {
    setResourceDefinition({
      ...resourceDefinition,
      ...values,
    });
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h4" size="xl">
          {intl.formatMessage(messages.resourceDefinitions)}
        </Title>
      </StackItem>
      <StackItem>
        <TextContent>
          <Text component={TextVariants.h6}>{intl.formatMessage(messages.permissionResourcesDetails)}</Text>
        </TextContent>
      </StackItem>
      <StackItem>
        <Form>
          <FormGroup label={intl.formatMessage(messages.key)} fieldId="resource-key">
            <TextInput
              aria-describedby="resource-key"
              id="resource-key"
              name="resource-key"
              onChange={(_, event) => updateDefinition({ key: event.currentTarget.value })}
              type="text"
              value={resourceDefinition.key}
            />
          </FormGroup>
          <FormGroup label={intl.formatMessage(messages.operation)} fieldId="resource-operation">
            <TextInput
              aria-describedby="resource-operation"
              id="resource-operation"
              name="resource-operation"
              onChange={(_, event) => updateDefinition({ operation: event.currentTarget.value })}
              type="text"
              value={resourceDefinition.operation}
            />
          </FormGroup>
          <FormGroup label={intl.formatMessage(messages.value)} fieldId="resource-value">
            <TextInput
              aria-describedby="resource-value"
              id="resource-value"
              name="resource-value"
              onChange={(_, event) => updateDefinition({ value: event.currentTarget.value })}
              type="text"
              value={resourceDefinition.value}
            />
          </FormGroup>
        </Form>
      </StackItem>
      <StackItem>
        <Button variant="primary" isDisabled={!isFormValid} onClick={addDefinition}>
          {intl.formatMessage(messages.addToDefinitions)}
        </Button>
      </StackItem>
      <StackItem>{new ResourceDefinitionsTable(formData, removeDefinition, true)}</StackItem>
    </Stack>
  );
};

ResourceDefinitions.propTypes = {
  resourceDefinitions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.number.isRequired,
      operation: PropTypes.number.isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
};

export default ResourceDefinitions;
