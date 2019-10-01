import React from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  FormGroup,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextInput,
  TextVariants,
  Title
} from '@patternfly/react-core';

const PermissionInformation = (formData, onHandleChange) => {
  const { application = '', permission = '', resourceType = ''  } = formData;

  let getFormValues = (values) => {
    return {
      application,
      permission,
      resourceType,
      ...values
    };
  };

  const handleChange = (values) => {
    const data = getFormValues(values);
    const isFormValid = data.application.trim().length > 0 && data.permission.trim().length > 0 &&
      data.resourceType.trim().length > 0;
    onHandleChange(data, isFormValid);
  };

  return (
    <Stack gutter="md">
      <StackItem>
        <Title size="xl">Permission</Title>
      </StackItem>
      <StackItem>
        <TextContent>
          <Text component={ TextVariants.h6 }>
              The permission string is made up of the following inputs where it denotes which application and the
              resource type the permission will be allowed for.
          </Text>
        </TextContent>
      </StackItem>
      <StackItem>
        <Form>
          <FormGroup
            label="Application"
            isRequired
            fieldId="application"
          >
            <TextInput
              aria-describedby="application"
              id="application"
              isRequired
              name="application"
              onChange={ (_, event) => handleChange({ application: event.currentTarget.value }) }
              type="text"
              value={ application }
            />
          </FormGroup>
          <FormGroup
            label="Resource type"
            isRequired
            fieldId="resource-type"
          >
            <TextInput
              aria-describedby="resource-type"
              id="resource-type"
              isRequired
              name="resource-type"
              onChange={ (_, event) => handleChange({ resourceType: event.currentTarget.value }) }
              type="text"
              value={ resourceType }
            />
          </FormGroup>
          <FormGroup
            label="Permission"
            isRequired
            fieldId="permission"
          >
            <TextInput
              aria-describedby="permission"
              id="permission"
              isRequired
              name="permission"
              onChange={ (_, event) => handleChange({ permission: event.currentTarget.value }) }
              type="text"
              value={ permission }
            />
          </FormGroup>
        </Form>
      </StackItem>
    </Stack>
  );
};

PermissionInformation.propTypes = {
  application: PropTypes.string,
  permission: PropTypes.string,
  resourceType: PropTypes.string
};

export default PermissionInformation;
