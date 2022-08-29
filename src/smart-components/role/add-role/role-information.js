import React from 'react';
import PropTypes from 'prop-types';
import { Form, FormGroup, Stack, StackItem, TextInput, TextArea, Title } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const RoleInformation = (formData, onHandleChange) => {
  const intl = useIntl();
  const { description = '', name = '' } = formData;

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h4" size="xl">
          {intl.formatMessage(messages.nameAndDescription)}
        </Title>
      </StackItem>
      <StackItem>
        <Form>
          <FormGroup label={intl.formatMessage(messages.name)} isRequired fieldId="name">
            <TextInput
              isRequired
              type="text"
              id="name"
              name="name"
              aria-describedby="name"
              value={name}
              onChange={(_, event) => onHandleChange({ name: event.currentTarget.value }, event.currentTarget.value.trim().length > 0)}
            />
          </FormGroup>
          <FormGroup label={intl.formatMessage(messages.description)} fieldId="description">
            <TextArea
              type="text"
              id="description"
              name="description"
              value={description}
              onChange={(_, event) => onHandleChange({ description: event.currentTarget.value }, true)}
            />
          </FormGroup>
        </Form>
      </StackItem>
    </Stack>
  );
};

RoleInformation.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
};

export default RoleInformation;
