import React, { Fragment, useState } from 'react';
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
import CreatableSelect from 'react-select/creatable';

const components = {
  DropdownIndicator: null
};

const CreatePolicy = (setPolicyData, selectedRoles, setSelectedRoles, optionIdx, setOptionIdx, createOption) => {
  const [ inputValue, setInputValue ] = useState('');
  const [ formData, setValues ] = useState({});

  const handleInputChange = (val) => {
    setInputValue(val);
  };

  const handleChange = data => {
    setValues({ ...formData,  ...data });
  };

  const handleUsersChange = (value) => {
    setSelectedRoles(value);
  };

  const handleKeyDown = (event) => {
    if (!inputValue) {return;}

    switch (event.key) {
      case 'Enter':
      case 'Tab':
        if (selectedRoles) {
          if (!selectedRoles.find(role => (role.label === inputValue))) {
            setSelectedRoles([ ...selectedRoles, createOption(inputValue) ]);
          }
        }
        else {
          setSelectedRoles([ createOption(inputValue) ]);
        }

        setInputValue('');
        event.preventDefault();
    }
  };

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
              Only one policy can be created at this time, more can be added later.</Text>
            <Text component={ TextVariants.h6 }>All fields are optional.</Text>
          </TextContent>
          <FormGroup
            label="Group name"
            isRequired
            fieldId="group-name"
          >
            <TextInput
              isRequired
              type="text"
              id="group-name"
              name="group-name"
              aria-describedby="group-name"
              value={ formData.name }
              onChange={ (_, event) => handleChange({ policy_name: event.currentTarget.value }) }
            />
          </FormGroup>
          <FormGroup label="Description" fieldId="group-description">
            <TextArea
              type="text"
              id="group-description"
              name="group-description"
              value={ formData.description }
              onChange={ (_, event) => handleChange({ policy_description: event.currentTarget.value }) }
            />
          </FormGroup>
          <CreatableSelect
            components={ components }
            inputValue={ inputValue }
            defaultValue={ selectedRoles }
            isClearable
            isMulti
            menuIsOpen={ false }
            onChange={ handleUsersChange }
            onInputChange={ handleInputChange }
            onKeyDown={ handleKeyDown }
            placeholder="Type the exact user name and press enter..."
            value={ selectedRoles }
          />
        </StackItem>
      </Stack>
    </Fragment>
  );
};

CreatePolicy.propTypes = {
  formData: PropTypes.object
};

export default CreatePolicy;
