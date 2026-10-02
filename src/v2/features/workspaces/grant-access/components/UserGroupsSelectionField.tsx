import React, { Fragment, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import type { UseFieldApiConfig } from '@data-driven-forms/react-form-renderer/use-field-api/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { useGroupsQuery } from '../../../../../v2/data/queries/groups';
import { UserGroupsSelectionTable } from './UserGroupsSelectionTable';

import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { AppLink } from '../../../../../shared/components/navigation/AppLink';
import pathnames from '../../../../utilities/pathnames';

const UserGroupsSelectionField: React.FC<UseFieldApiConfig> = (props) => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const { input } = useFieldApi(props);

  // React Query hook for groups
  const { data: groupsData, isLoading } = useGroupsQuery({ limit: 1000 });
  const groups = groupsData?.data ?? [];

  const [selectedGroups, setSelectedGroups] = useState<string[]>(formOptions.getState().values['selected-user-groups'] || []);

  useEffect(() => {
    input.onChange(selectedGroups);
    input.onBlur();
    formOptions.change('selected-user-groups', selectedGroups);
  }, [selectedGroups]);

  const selectableGroups = groups.filter((group) => !group.platform_default && !group.admin_default);

  return (
    <Fragment>
      <Form>
        <Stack>
          <StackItem>
            <Title headingLevel="h2" size="xl" className="pf-v6-u-mb-sm">
              {intl.formatMessage({
                id: 'selectUserGroupsContentTitle',
                defaultMessage: 'Select user group(s) you want to grant access to',
                description: 'Select user groups content header title',
              })}
            </Title>
          </StackItem>
          <StackItem>
            <Content component="p" className="pf-v6-u-mb-md">
              {intl.formatMessage(
                {
                  id: 'selectUserGroupsDescription',
                  defaultMessage:
                    "Select the user group(s) you wish to grant access to. If you don't see the group you wish to select, you must create a new group in <link>Users and Groups</link>.",
                  description: 'Select user groups step description',
                },
                {
                  link: (chunks) => <AppLink to={pathnames['user-groups'].link()}>{chunks}</AppLink>,
                },
              )}
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
