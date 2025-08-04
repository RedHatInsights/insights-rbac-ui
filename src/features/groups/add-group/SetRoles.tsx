import React, { Fragment, useEffect, useState } from 'react';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { FormGroup, Stack, StackItem, Text, TextContent } from '@patternfly/react-core';
import { RolesList } from './RolesList';
import '../../../App.scss';

interface Role {
  uuid: string;
  name: string;
  display_name?: string;
  description?: string;
  [key: string]: any;
}

interface SetRolesProps {
  name: string;
  // Data-driven-forms props
  input?: any;
  meta?: any;
  [key: string]: any;
}

export const SetRoles: React.FC<SetRolesProps> = (props) => {
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
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
            <Text>{'Select roles to assign to this group'}</Text>
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
