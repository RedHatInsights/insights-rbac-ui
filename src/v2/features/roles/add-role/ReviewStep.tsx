import React from 'react';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, Stack, StackItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useIntl } from 'react-intl';
import messages from '../../../../Messages';

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
  const formOptions = useFormApi();
  const {
    'role-name': name,
    'role-description': description,
    'role-copy-name': copyName,
    'role-copy-description': copyDescription,
    'add-permissions-table': permissions,
    'resource-definitions': resourceDefinitions,
    'has-cost-resources': hasCostResources,
    'role-type': type,
  } = formOptions.getState().values;

  const columns = [intl.formatMessage(messages.application), intl.formatMessage(messages.resourceType), intl.formatMessage(messages.operation)];
  const rows = (permissions as { uuid: string }[]).map((permission) => ({
    cells: permission.uuid.split(':'),
  }));

  const resourceDefinitionsRows = ((resourceDefinitions as { permission: string; resources: string[] }[]) || []).map(({ permission, resources }) => ({
    cells: [permission, resources.join(', ')],
  }));

  return (
    <Stack hasGutter>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(messages.name)}</DescriptionListTerm>
            <DescriptionListDescription>{type === 'create' ? name : copyName}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(messages.description)}</DescriptionListTerm>
            <DescriptionListDescription>{(type === 'create' ? description : copyDescription) ?? <em>No description</em>}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
      <StackItem>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{intl.formatMessage(messages.permissions)}</DescriptionListTerm>
            <DescriptionListDescription>
              <PermissionsTable columns={columns} rows={rows} label="Permissions" />
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
                <PermissionsTable
                  columns={[intl.formatMessage(messages.permission), intl.formatMessage(messages.resourceDefinitions)]}
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
