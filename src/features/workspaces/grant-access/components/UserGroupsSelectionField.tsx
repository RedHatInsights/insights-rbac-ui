import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { RBACStore } from '../../../../redux/store';
import { fetchGroups } from '../../../../redux/groups/actions';
import { UserGroupsSelectionTable } from './UserGroupsSelectionTable';
import messages from '../../../../Messages';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup, Stack, StackItem } from '@patternfly/react-core';

interface UserGroupsSelectionFieldProps {
  name: string;
}

const UserGroupsSelectionField: React.FC<UserGroupsSelectionFieldProps> = ({ name }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const formOptions = useFormApi();
  const { input } = useFieldApi({ name });

  const { groups, isLoading } = useSelector((state: RBACStore) => ({
    groups: state.groupReducer.groups?.data || [],
    isLoading: state.groupReducer.isLoading,
  }));

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  const [selectedGroups, setSelectedGroups] = useState<string[]>(formOptions.getState().values['selected-user-groups'] || []);

  useEffect(() => {
    input.onChange(selectedGroups);
    formOptions.change('selected-user-groups', selectedGroups);
  }, [selectedGroups]);

  const selectableGroups = groups.filter((group) => !group.platform_default && !group.admin_default);

  return (
    <Fragment>
      <Form>
        <Stack>
          <StackItem>
            <Content component="p" className="pf-v6-u-mb-md">
              {intl.formatMessage(messages.selectUserGroupsDescription)}
            </Content>
          </StackItem>
          <StackItem>
            <FormGroup fieldId="user-groups-selection-table">
              <UserGroupsSelectionTable
                groups={selectableGroups}
                selectedGroups={selectedGroups}
                onGroupSelection={setSelectedGroups}
                isLoading={isLoading}
              />
            </FormGroup>
          </StackItem>
        </Stack>
      </Form>
    </Fragment>
  );
};

export default UserGroupsSelectionField;
