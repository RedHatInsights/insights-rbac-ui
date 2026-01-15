import React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

interface Permission {
  uuid: string;
}

interface ResourceDefinition {
  resources: string[];
}

const AddRolePermissionSummaryContent: React.FC = () => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const {
    'role-name': name,
    'role-description': description,
    'add-permissions-table': selectedPermissions,
    'resource-definitions': resourceDefinitions,
    'has-cost-resources': hasCostResources,
  } = formOptions.getState().values;

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h1" size="xl">
          {intl.formatMessage(messages.reviewDetails)}
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(messages.roleName)}</DescriptionListTerm>
            <DescriptionListDescription>{name as string}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(messages.roleDescription)}</DescriptionListTerm>
            <DescriptionListDescription>{(description as string) || <em>No description</em>}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(messages.addedPermissions)}</DescriptionListTerm>
            <DescriptionListDescription>
              <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                {(selectedPermissions as Permission[]).map((permission, index) => (
                  <li key={index}>{permission.uuid}</li>
                ))}
              </ul>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      {hasCostResources && (
        <StackItem>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{intl.formatMessage(messages.resourceDefinitions)}</DescriptionListTerm>
              <DescriptionListDescription>
                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  {(resourceDefinitions as ResourceDefinition[]).map(({ resources }) =>
                    resources.map((resource, index) => <li key={index}>{resource}</li>),
                  )}
                </ul>
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </StackItem>
      )}
    </Stack>
  );
};

export default AddRolePermissionSummaryContent;
