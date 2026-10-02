import React from 'react';
import { useIntl } from 'react-intl';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { TableVariant } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import SkeletonTable from '@patternfly/react-component-groups/dist/dynamic/SkeletonTable';

import type { Access } from '../../../data/api/access';
import { commonMessages } from '../../../../shared/messages/common';

interface PermissionsNestedTableProps {
  access?: Access[];
  accessCount?: number;
  isLoading: boolean;
}

export const PermissionsNestedTable: React.FC<PermissionsNestedTableProps> = ({ access, accessCount, isLoading }) => {
  const intl = useIntl();

  const columns = [
    intl.formatMessage(commonMessages.application),
    intl.formatMessage(commonMessages.resourceType),
    intl.formatMessage(commonMessages.operation),
  ];

  if (isLoading) {
    return <SkeletonTable rows={accessCount || 3} columns={columns} variant={TableVariant.compact} />;
  }

  if (!access || access.length === 0) {
    return (
      <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
        {intl.formatMessage(commonMessages.noPermissions)}
      </Content>
    );
  }

  return (
    <Table aria-label="Permissions table" ouiaId="permissions-in-role-nested-table" variant={TableVariant.compact}>
      <Thead>
        <Tr>
          <Th>{intl.formatMessage(commonMessages.application)}</Th>
          <Th>{intl.formatMessage(commonMessages.resourceType)}</Th>
          <Th>{intl.formatMessage(commonMessages.operation)}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {access.map((accessItem, index) => {
          const [appName, resourceType, operation] = (accessItem.permission || '').split(':');
          return (
            <Tr key={`${accessItem.permission}-${index}`}>
              <Td dataLabel={intl.formatMessage(commonMessages.application)}>{appName}</Td>
              <Td dataLabel={intl.formatMessage(commonMessages.resourceType)}>{resourceType}</Td>
              <Td dataLabel={intl.formatMessage(commonMessages.operation)}>{operation}</Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export default PermissionsNestedTable;
