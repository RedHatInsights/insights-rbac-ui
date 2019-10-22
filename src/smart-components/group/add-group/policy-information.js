import React, { Fragment, useState } from 'react';
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
import asyncDebounce from '../../../utilities/async-debounce';
import { fetchPolicyByName } from '../../../helpers/policy/policy-helper';

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

const PolicyInformation = ({ title, editType, formData, onHandleChange, setIsPolicyInfoValid }) => {
  const [ error, setError ] = useState(undefined);
  const policy = formData.policy ? formData.policy : { name: '', description: '' };

  const validateName = (name) => fetchPolicyByName(name)
  .then(({ data }) => {
    return data.find(pol => name === pol.name)
      ? 'Name has already been taken'
      : undefined;
  });

  const setResult = (result) => {
    setError(result);
    setIsPolicyInfoValid(!result);
  };

  const debouncedValidator = (data, validateCallback) => asyncDebounce(validateName(data.name).then((result) => validateCallback(result)));

  const handleNameChange = () => {
    debouncedValidator(policy, setResult);
  };

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
              isValid={ !error }
              helperTextInvalid={ error }
            >
              <TextInput
                type="text"
                id="policy-name"
                name="policy-name"
                aria-describedby="policy-name"
                value={ policy.name }
                onBlur={ handleNameChange }
                onChange={ (_, event) => { setError(undefined); onHandleChange({ policy: { ...policy, name: event.currentTarget.value }}); } }
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
  onHandleChange: PropTypes.func.required,
  setIsPolicyInfoValid: PropTypes.func.required
};

PolicyInformation.defaultProps = {
  title: 'Create policy',
  editType: 'add'
};

export default PolicyInformation;

