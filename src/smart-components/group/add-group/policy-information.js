import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  FormGroup,
  Stack,
  StackItem,
  Text,
  TextArea,
  TextContent,
  TextInput,
  TextVariants,
  Title
} from '@patternfly/react-core';

const PolicyInformation = (title, formValue, onHandleChange) => {
  return (
    <Fragment>
      <Form>
        <Stack gutter="md">
          <StackItem>
            <Title size="xl">{ title }</Title>
          </StackItem>
          <StackItem>
            <TextContent>
              <Text component={ TextVariants.h6 }>Policies are the permissions set for this group.
                  Groups can have one or more policies.
                  Policies are created for a group, they cannot be shared.
                  You can only create one policy at this time.
                  It is possible to create more for this group at a later time.<br/>
                  All fields are optional.</Text>
            </TextContent>
          </StackItem>
          <StackItem>
            <FormGroup
              label="Name"
              fieldId="policy-name"
            >
              <TextInput
                isRequired
                type="text"
                id="policy-name"
                name="policy-name"
                aria-describedby="policy-name"
                value={ formValue.policyName }
                onChange={ (_, event) => onHandleChange({ policyName: event.currentTarget.value }) }
              />
            </FormGroup>
          </StackItem>
          <StackItem>
            <FormGroup label="Description" fieldId="policy-description">
              <TextArea
                type="text"
                id="policy-description"
                name="policy-description"
                value={ formValue.policyDescription }
                onChange={ (_, event) => onHandleChange({ policyDescription: event.currentTarget.value }) }
              />
            </FormGroup>
          </StackItem>
        </Stack>
      </Form>
    </Fragment>
  );
};

PolicyInformation.propTypes = {
  formData: PropTypes.object,
  title: PropTypes.string
};

PolicyInformation.defaultProps = {
  title: 'Create policy'
};

export default PolicyInformation;

