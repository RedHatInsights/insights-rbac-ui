import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { FormGroup, Stack, StackItem, Text, TextContent } from '@patternfly/react-core';
import RolesList from './roles-list';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import '../../../App.scss';

const SetRoles = (props) => {
  const intl = useIntl();
  const [selectedRoles, setSelectedRoles] = useState([]);
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();

  useEffect(() => {
    setSelectedRoles(formOptions.getState().values['roles-list'] || []);
  }, []);

  useEffect(() => {
    input.onChange(selectedRoles);
    formOptions.change('roles-list', selectedRoles);
  }, [selectedRoles]);

  return (
    <Fragment>
      <Stack hasGutter>
        <StackItem>
          <TextContent>
            <Text>{intl.formatMessage(messages.selectRolesForGroupText)}</Text>
          </TextContent>
        </StackItem>
        <StackItem>
          <FormGroup fieldId="select-role">
            <RolesList selectedRoles={selectedRoles} setSelectedRoles={setSelectedRoles} rolesExcluded={false} />
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
