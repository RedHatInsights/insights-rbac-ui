import React, { Fragment, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { useRolesQuery } from '../../../../data/queries/roles';
import { RolesSelectionTable } from './RolesSelectionTable';
import messages from '../../../../Messages';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup, Stack, StackItem } from '@patternfly/react-core';

interface RolesSelectionFieldProps {
  name: string;
}

const RolesSelectionField: React.FC<RolesSelectionFieldProps> = ({ name }) => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const { input } = useFieldApi({ name });

  // React Query hook for roles
  const { data: rolesData, isLoading } = useRolesQuery({ limit: 1000 });
  const rolesForWizard = React.useMemo(() => rolesData?.data ?? [], [rolesData?.data]);

  const [selectedRoles, setSelectedRoles] = useState<string[]>(formOptions.getState().values['selected-roles'] || []);

  useEffect(() => {
    input.onChange(selectedRoles);
    formOptions.change('selected-roles', selectedRoles);
  }, [selectedRoles]);

  return (
    <Fragment>
      <Form>
        <Stack>
          <StackItem>
            <Content component="p" className="pf-v6-u-mb-md">
              {intl.formatMessage(messages.selectRolesDescription)}
            </Content>
          </StackItem>
          <StackItem>
            <FormGroup fieldId="roles-selection-table">
              <RolesSelectionTable roles={rolesForWizard} selectedRoles={selectedRoles} onRoleSelection={setSelectedRoles} isLoading={isLoading} />
            </FormGroup>
          </StackItem>
        </Stack>
      </Form>
    </Fragment>
  );
};

export default RolesSelectionField;
