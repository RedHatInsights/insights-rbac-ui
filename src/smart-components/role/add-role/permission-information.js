import React from 'react';
import PropTypes from 'prop-types';
import { Form, FormGroup, Stack, StackItem, Text, TextContent, TextInput, TextVariants, Title } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const PermissionInformation = (formData, onHandleChange) => {
  const intl = useIntl();
  const { application = '', permission = '', resourceType = '' } = formData;

  let getFormValues = (values) => {
    return {
      application,
      permission,
      resourceType,
      ...values,
    };
  };

  const handleChange = (values) => {
    const data = getFormValues(values);
    const isFormValid = data.application.trim().length > 0 && data.permission.trim().length > 0 && data.resourceType.trim().length > 0;
    onHandleChange(data, isFormValid);
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h4" size="xl">
          {intl.formatMessage(messages.permission)}
        </Title>
      </StackItem>
      <StackItem>
        <TextContent>
          <Text component={TextVariants.h6}>{intl.formatMessage(messages.permissionStringDescription)}</Text>
        </TextContent>
      </StackItem>
      <StackItem>
        <Form>
          <FormGroup label={intl.formatMessage(messages.application)} isRequired fieldId="application">
            <TextInput
              aria-describedby="application"
              id="application"
              isRequired
              name="application"
              onChange={(_, event) => handleChange({ application: event.currentTarget.value })}
              type="text"
              value={application}
            />
          </FormGroup>
          <FormGroup label={intl.formatMessage(messages.resourceType)} isRequired fieldId="resource-type">
            <TextInput
              aria-describedby="resource-type"
              id="resource-type"
              isRequired
              name="resource-type"
              onChange={(_, event) => handleChange({ resourceType: event.currentTarget.value })}
              type="text"
              value={resourceType}
            />
          </FormGroup>
          <FormGroup label={intl.formatMessage(messages.permission)} isRequired fieldId="permission">
            <TextInput
              aria-describedby="permission"
              id="permission"
              isRequired
              name="permission"
              onChange={(_, event) => handleChange({ permission: event.currentTarget.value })}
              type="text"
              value={permission}
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
  resourceType: PropTypes.string,
};

export default PermissionInformation;
