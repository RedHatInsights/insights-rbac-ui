import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  FormGroup,
  Stack,
  StackItem,
  TextInput,
  TextArea,
  Title
} from '@patternfly/react-core';

const RoleInformation = (formData, onHandleChange) => {
  const { description = '', name = '' } = formData;

  return (
    <Stack gutter="md">
      <StackItem>
        <Title size="xl">Name and description</Title>
      </StackItem>
      <StackItem>
        <Form>
          <FormGroup
            label="Name"
            isRequired
            fieldId="name"
          >
            <TextInput
              isRequired
              type="text"
              id="name"
              name="name"
              aria-describedby="name"
              value={ name }
              onChange={ (_, event) => onHandleChange({ name: event.currentTarget.value },
                event.currentTarget.value.trim().length > 0) }
            />
          </FormGroup>
          <FormGroup label="Description" fieldId="description">
            <TextArea
              type="text"
              id="description"
              name="description"
              value={ description }
              onChange={ (_, event) => onHandleChange({ description: event.currentTarget.value }) }
            />
          </FormGroup>
        </Form>
      </StackItem>
    </Stack>
  );
};

RoleInformation.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string
};

export default RoleInformation;
