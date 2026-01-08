import React, { Fragment, useCallback, useEffect, useState } from 'react';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';

import { RolesList } from './RolesList';

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
  const formOptions = useFormApi();
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(formOptions.getState().values['roles-list'] || []);
  const { input } = useFieldApi(props);

  useEffect(() => {
    input.onChange(selectedRoles);
    formOptions.change('roles-list', selectedRoles);
  }, [selectedRoles]); // Remove unstable formOptions and input dependencies

  // Handle selection changes from RolesList - sync with form API
  const handleRoleSelection = useCallback((roles: Role[]) => {
    setSelectedRoles(roles);
  }, []);

  return (
    <Fragment>
      <Stack hasGutter>
        <StackItem>
          <Content>
            <Content component="p">{'Select roles to assign to this group'}</Content>
          </Content>
        </StackItem>
        <StackItem>
          <FormGroup fieldId="select-role">
            <RolesList initialSelectedRoles={selectedRoles} onSelect={handleRoleSelection} rolesExcluded={false} />
          </FormGroup>
        </StackItem>
      </Stack>
    </Fragment>
  );
};
