import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
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

const PolicyStep = (formValue, onHandleChange, setGroupData,
  selectedPolicies, setPolicies, selectedRoles, setSelectedRoles, roles) => {

  const onOptionSelect = (selectedValues = []) =>
  { setSelectedRoles(selectedValues.map(val => val.value)); };

  const dropdownItems = roles.map(role => ({ value: role.name, label: role.name, id: role.username }));

  return (
    <Fragment>
      <Stack gutter="md">
        <StackItem>
          <Title size="xl">Create policy</Title>
        </StackItem>
        <StackItem>
          <TextContent>
            <Text component={ TextVariants.h6 }>Policies are the permissions set for this group.
              Groups can have one or more policies.
              Policies are created for a group, they cannot be shared.
              You can only create one policy at this time.
              It is possible to create more for this group at a later time.</Text>
            <Text component={ TextVariants.h6 }>All fields are optional.</Text>
          </TextContent>
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
          <FormGroup label="Description" fieldId="policy-description">
            <TextArea
              type="text"
              id="policy-description"
              name="policy-description"
              value={ formValue.policyDescription }
              onChange={ (_, event) => onHandleChange({ policyDescription: event.currentTarget.value }) }
            />
          </FormGroup>
          <Select
            options={ dropdownItems }
            isClearable
            isMulti={ true }
            placeholders={ 'Select Roles' }
            onChange={ onOptionSelect }
            closeMenuOnSelect={ false } />
        </StackItem>
      </Stack>
    </Fragment>
  );
};

PolicyStep.propTypes = {
  formData: PropTypes.object
};

export default PolicyStep;

