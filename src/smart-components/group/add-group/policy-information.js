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

const PolicyInfoText = ({ title, editType }) => {
  return (editType === 'edit') ?
    <TextContent>
      <Text component={ TextVariants.small }> All fields are required </Text>
    </TextContent> :
    <Fragment>
      <StackItem>
        <Title size="xl">{ title }</Title>
      </StackItem>
      <TextContent>
        <Text component={ TextVariants.h6 }>Policies are the permissions set for this group.
        Groups can have one or more policies.
        Policies are created for a group, they cannot be shared.
        You can only create one policy at this time.
        It is possible to create more for this group at a later time.<br/>
        All fields are optional.</Text>
      </TextContent>
    </Fragment>;
};

PolicyInfoText.propTypes = {
  title: PropTypes.string,
  editType: PropTypes.string
};

const PolicyInformation = ({ title, editType, formData, onHandleChange }) => {
  const policy = formData.policy ? formData.policy : { name: '', description: '' };
  return (
    <Fragment>
      <Form>
        <Stack gutter="md">
          <StackItem>
            <PolicyInfoText title= { title } editType = { editType }/>
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
                value={ policy.name }
                onChange={ (_, event) => onHandleChange({ policy: { ...policy, name: event.currentTarget.value }}) }
              />
            </FormGroup>
          </StackItem>
          <StackItem>
            <FormGroup label="Description" fieldId="policy-description">
              <TextArea
                type="text"
                id="policy-description"
                name="policy-description"
                value={ policy.description }
                onChange={ (_, event) => onHandleChange({ policy: { ...policy, description: event.currentTarget.value }}) }
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
  editType: PropTypes.string,
  title: PropTypes.string,
  onHandleChange: PropTypes.func.required
};

PolicyInformation.defaultProps = {
  title: 'Create policy',
  editType: 'add'
};

export default PolicyInformation;

