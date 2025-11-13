import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { RBACStore } from '../../../../redux/store';
import { fetchRolesForWizard } from '../../../../redux/roles/actions';
import { RolesSelectionTable } from './RolesSelectionTable';
import messages from '../../../../Messages';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup, Stack, StackItem } from '@patternfly/react-core';

interface RolesSelectionFieldProps {
  name: string;
}

const RolesSelectionField: React.FC<RolesSelectionFieldProps> = ({ name }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const formOptions = useFormApi();
  const { input } = useFieldApi({ name });

  const { rolesForWizard, isLoading } = useSelector((state: RBACStore) => ({
    rolesForWizard: state.roleReducer.rolesForWizard,
    isLoading: state.roleReducer.isLoading,
  }));

  useEffect(() => {
    dispatch(fetchRolesForWizard());
  }, [dispatch]);

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
            <Text className="pf-v5-u-mb-md">{intl.formatMessage(messages.selectRolesDescription)}</Text>
          </StackItem>
          <StackItem>
            <FormGroup fieldId="roles-selection-table">
              <RolesSelectionTable
                roles={rolesForWizard?.data || []}
                selectedRoles={selectedRoles}
                onRoleSelection={setSelectedRoles}
                isLoading={isLoading}
              />
            </FormGroup>
          </StackItem>
        </Stack>
      </Form>
    </Fragment>
  );
};

export default RolesSelectionField;
