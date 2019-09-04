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
import Select from 'react-select';

const PolicyInformation = (formValue, onHandleChange, selectedRoles, setSelectedRoles, roles) => {

  const onOptionSelect = (selectedValues) =>
  { setSelectedRoles(selectedValues); };

  const dropdownItems = roles.map(role => ({ value: role.uuid, label: role.name, id: role.uuid }));

  return (
    <Fragment>
      <Form>
        <Stack gutter="md">
          <StackItem>
            <Title size="xl">Edit policy information</Title>
          </StackItem>
          <StackItem>
            <TextContent>
              <Text component={ TextVariants.h6 }><br/>
                  All fields are required.</Text>
            </TextContent>
          </StackItem>
          <StackItem>
            <FormGroup
              label="Policy name"
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
          <StackItem>
            <FormGroup
              label="Select roles"
              fieldId="select-role"
            >
              <Select
                options={ dropdownItems }
                isClearable
                isMulti={ true }
                placeholders={ 'Select Roles' }
                onChange={ onOptionSelect }
                closeMenuOnSelect={ false } />
            </FormGroup>
          </StackItem>
        </Stack>
      </Form>
    </Fragment>
  );
};

PolicyInformation.propTypes = {
  formData: PropTypes.object
};

export default PolicyInformation;

