import React, { Fragment, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useFieldApi from '@data-driven-forms/react-form-renderer/dist/esm/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/esm/use-form-api';
import { FormGroup, Stack, StackItem, Text, TextContent } from '@patternfly/react-core';
import RolesList from './roles-list';
import '../../../App.scss';

const SetRoles = (props) => {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();

  useEffect(() => {
    input.onChange(selectedRoles);
    formOptions.change('selected-roles', selectedRoles);
  }, [selectedRoles]);

  return (
    <Fragment>
      <Stack hasGutter>
        <StackItem>
          <TextContent>
            <Text>Select one or more roles to add to this group.</Text>
          </TextContent>
        </StackItem>
        <StackItem>
          <FormGroup fieldId="select-role">
            <RolesList selectedRoles={selectedRoles} setSelectedRoles={setSelectedRoles} />
          </FormGroup>
        </StackItem>
      </Stack>
    </Fragment>
  );
};

SetRoles.propTypes = {
  selectedRoles: PropTypes.array,
  setSelectedRoles: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.string,
};

export default SetRoles;
