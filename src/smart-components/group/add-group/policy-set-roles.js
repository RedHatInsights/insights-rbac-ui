import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  FormGroup,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  Title
} from '@patternfly/react-core';
import AsyncSelect from 'react-select/async';
import asyncDebounce from '../../../utilities/async-debounce';
import { fetchFilterRoles } from '../../../helpers/role/role-helper';

const PolicySetRoles = (formValue, selectedRoles, setSelectedRoles, roles) => {
  const [ inputValue, setInputValue ] = useState([]);

  const onInputChange = (newValue) => {
    const value = newValue.replace(/\W/g, '');
    setInputValue(value);
  };

  const onOptionSelect = (selectedValues) =>
  { setSelectedRoles(selectedValues); };

  const dropdownItems = roles.map(role => ({ value: role.uuid, label: role.name, id: role.uuid }));
  const loadRoleOptions = (inputValue) => fetchFilterRoles(inputValue);

  return (
    <Fragment>
      <Form>
        <Stack gutter="md">
          <StackItem>
            <Title size="xl">Add roles to policy</Title>
          </StackItem>
          <StackItem>
            <TextContent>
              <Text component={ TextVariants.h6 }>Select at least one role to add to policy.</Text>
            </TextContent>
          </StackItem>
          <StackItem>
            <FormGroup
              label="Select roles"
              fieldId="select-role"
            >
              <AsyncSelect
                options={ dropdownItems }
                isClearable
                isMulti={ true }
                placeholders={ 'Select Roles' }
                onChange={ onOptionSelect }
                closeMenuOnSelect={ false }
                inpuValue={ inputValue }
                loadOptions={ asyncDebounce(loadRoleOptions) }
                defaultOptions={ dropdownItems }
                onInputChange={ onInputChange }
              />
            </FormGroup>
          </StackItem>
        </Stack>
      </Form>
    </Fragment>
  );
};

PolicySetRoles.propTypes = {
  formData: PropTypes.object
};

export default PolicySetRoles;

