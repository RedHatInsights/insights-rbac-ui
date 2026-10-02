import React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core/dist/dynamic/components/DescriptionList';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';
import { commonMessages } from '../../../../shared/messages/common';

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
          {intl.formatMessage(commonMessages.reviewDetails)}
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(commonMessages.roleName)}</DescriptionListTerm>
            <DescriptionListDescription>{name as string}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {intl.formatMessage({ id: 'roleDescription', defaultMessage: 'Role description', description: 'Role description label' })}
            </DescriptionListTerm>
            <DescriptionListDescription>{(description as string) || <em>No description</em>}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>
              {intl.formatMessage({ id: 'addedPermissions', defaultMessage: 'Added permissions', description: 'Added permissions label' })}
            </DescriptionListTerm>
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
              <DescriptionListTerm>{intl.formatMessage(commonMessages.resourceDefinitions)}</DescriptionListTerm>
              <DescriptionListDescription>
                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  {(resourceDefinitions as ResourceDefinition[]).map(({ resources }, idx) =>
                    resources.length > 0 ? (
                      resources.map((resource, index) => <li key={`${idx}-${index}`}>{resource}</li>)
                    ) : (
                      <li key={`all-${idx}`}>
                        {intl.formatMessage({
                          id: 'allResources',
                          defaultMessage: 'All resources',
                          description: 'All resources label for cost management permission definitions',
                        })}
                      </li>
                    ),
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
