import React from 'react';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core/dist/dynamic/components/DescriptionList';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { defineMessages, useIntl } from 'react-intl';

import { useWorkspacesRenameFlag } from '../../../../capabilities/useWorkspacesRenameFlag';
import { commonMessages } from '../../../../shared/messages/common';

const messages = defineMessages({
  workspacesDefinition: { id: 'workspacesDefinition', defaultMessage: 'Workspaces definition', description: 'Group workspaces label' },
  groupDefinition: { id: 'groupDefinition', defaultMessage: 'Group definition', description: 'Group definition label' },
});

interface Row {
  cells: string[];
}

const PermissionsTable: React.FC<{ columns: string[]; rows: Row[]; label: string }> = ({ columns, rows, label }) => (
  <Table aria-label={label} variant="compact" borders={false}>
    <Thead>
      <Tr>
        {columns.map((col) => (
          <Th key={col}>{col}</Th>
        ))}
      </Tr>
    </Thead>
    <Tbody>
      {rows.map((row, rowIndex) => (
        <Tr key={rowIndex}>
          {row.cells.map((cell, cellIndex) => (
            <Td key={cellIndex}>{cell}</Td>
          ))}
        </Tr>
      ))}
    </Tbody>
  </Table>
);

const ReviewStep: React.FC = () => {
  const intl = useIntl();
  const enableWorkspacesNameChange = useWorkspacesRenameFlag();
  const formOptions = useFormApi();
  const {
    'role-name': name,
    'role-description': description,
    'role-copy-name': copyName,
    'role-copy-description': copyDescription,
    'add-permissions-table': permissions,
    'resource-definitions': resourceDefinitions,
    'has-cost-resources': hasCostResources,
    'inventory-group-permissions': inventoryGroupPermissions,
    'role-type': type,
  } = formOptions.getState().values;

  const columns = [
    intl.formatMessage(commonMessages.application),
    intl.formatMessage(commonMessages.resourceType),
    intl.formatMessage(commonMessages.operation),
  ];
  const rows = (permissions as { uuid: string }[]).map((permission) => ({
    cells: permission.uuid.split(':'),
  }));

  const resourceDefinitionsRows = ((resourceDefinitions as { permission: string; resources: string[] }[]) || []).map(({ permission, resources }) => ({
    cells: [
      permission,
      resources.length > 0
        ? resources.join(', ')
        : intl.formatMessage({
            id: 'allResources',
            defaultMessage: 'All resources',
            description: 'All resources label for cost management permission definitions',
          }),
    ],
  }));

  const groupPermissionsRows = ((inventoryGroupPermissions as { permission: string; groups?: { id: string | null; name?: string }[] }[]) || []).map(
    ({ permission, groups }) => ({
      cells: [
        permission,
        groups
          ?.map((group) =>
            group?.id === null
              ? intl.formatMessage({ id: 'ungroupedSystems', defaultMessage: 'Ungrouped systems', description: 'Ungrouped systems button label' })
              : group?.name,
          )
          .join(', ') || '',
      ],
    }),
  );

  return (
    <Stack hasGutter>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(commonMessages.name)}</DescriptionListTerm>
            <DescriptionListDescription>{type === 'create' ? name : copyName}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(commonMessages.description)}</DescriptionListTerm>
            <DescriptionListDescription>{(type === 'create' ? description : copyDescription) || <em>No description</em>}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(commonMessages.permissions)}</DescriptionListTerm>
            <DescriptionListDescription>
              <PermissionsTable columns={columns} rows={rows} label="Permissions" />
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      {inventoryGroupPermissions && (
        <StackItem>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{intl.formatMessage(commonMessages.resourceDefinitions)}</DescriptionListTerm>
              <DescriptionListDescription>
                <PermissionsTable
                  columns={[
                    intl.formatMessage({ id: 'permission', defaultMessage: 'Permission', description: 'Permission label' }),
                    intl.formatMessage(enableWorkspacesNameChange ? messages.workspacesDefinition : messages.groupDefinition),
                  ]}
                  rows={groupPermissionsRows}
                  label="Resource definitions"
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </StackItem>
      )}
      {hasCostResources && (
        <StackItem>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{intl.formatMessage(commonMessages.resourceDefinitions)}</DescriptionListTerm>
              <DescriptionListDescription>
                <PermissionsTable
                  columns={[
                    intl.formatMessage({ id: 'permission', defaultMessage: 'Permission', description: 'Permission label' }),
                    intl.formatMessage(commonMessages.resourceDefinitions),
                  ]}
                  rows={resourceDefinitionsRows}
                  label="Cost resource definitions"
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </StackItem>
      )}
    </Stack>
  );
};

export default ReviewStep;
