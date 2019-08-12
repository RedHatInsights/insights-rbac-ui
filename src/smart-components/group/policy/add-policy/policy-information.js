import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  FormPolicy,
  Stack,
  StackItem,
  TextInput,
  TextArea,
  Title
} from '@patternfly/react-core';

const PolicyInformation = (formValue, onHandleChange) => {
  return (
    <Fragment>
      <Stack gutter="md">
        <StackItem>
          <Title size="xl"> Add policy </Title>
        </StackItem>
        <StackItem>
          <Form>
            <FormPolicy
              label="Policy name"
              isRequired
              fieldId="policy-name"
            >
              <TextInput
                isRequired
                type="text"
                id="policy-name"
                name="policy-name"
                aria-describedby="policy-name"
                value={ formValue.name }
                onChange={ (_, event) => onHandleChange({ name: event.currentTarget.value }) }
              />
            </FormPolicy>
            <FormPolicy label="Description" fieldId="policy-description">
              <TextArea
                type="text"
                id="policy-description"
                name="policy-description"
                value={ formValue.description }
                onChange={ (_, event) => onHandleChange({ description: event.currentTarget.value }) }
              />
            </FormPolicy>
          </Form>
        </StackItem>
      </Stack>
    </Fragment>
  );
};

PolicyInformation.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string
};

export default PolicyInformation;
