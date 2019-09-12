import React, { Fragment } from 'react';
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
import Select from 'react-select';

const PolicySetRoles = (formValue, selectedRoles, setSelectedRoles, roles) => {

  const onOptionSelect = (selectedValues) =>
  { setSelectedRoles(selectedValues); };

  const dropdownItems = roles.map(role => ({ value: role.uuid, label: role.name, id: role.uuid }));

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

PolicySetRoles.propTypes = {
  formData: PropTypes.object
};

export default PolicySetRoles;

