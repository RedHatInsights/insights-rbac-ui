import React from 'react';
import { useIntl } from 'react-intl';
import { Table, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { SkeletonTableBody } from '@patternfly/react-component-groups';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { AppLink } from '../../../components/navigation/AppLink';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import { getDateFormat } from '../../../helpers/stringUtilities';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';
import type { Group } from '../types';

interface GroupsRolesTableProps {
  group: Group;
}

export const GroupsRolesTable: React.FC<GroupsRolesTableProps> = ({ group }) => {
  const intl = useIntl();

  const compoundRolesCells = [
    intl.formatMessage(messages.roleName),
    intl.formatMessage(messages.description),
    intl.formatMessage(messages.lastModified),
  ];

  if (!group.roles || group.isLoadingRoles) {
    return (
      <Table aria-label={`Roles for ${group.name}`} variant={TableVariant.compact} ouiaId={`compound-roles-${group.uuid}`}>
        <Thead>
          <Tr>
            {compoundRolesCells.map((cell, index) => (
              <Th key={index}>{cell}</Th>
            ))}
          </Tr>
        </Thead>
        <SkeletonTableBody rowsCount={3} columnsCount={compoundRolesCells.length} />
      </Table>
    );
  }

  return (
    <Table aria-label={`Roles for ${group.name}`} variant={TableVariant.compact} ouiaId={`compound-roles-${group.uuid}`}>
      <Thead>
        <Tr>
          {compoundRolesCells.map((cell, index) => (
            <Th key={index}>{cell}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {group.roles.length > 0 ? (
          group.roles.map((role: any, index: number) => (
            <Tr key={index}>
              <Td dataLabel={compoundRolesCells[0]}>
                <AppLink to={pathnames['role-detail'].link.replace(':roleId', role.uuid)}>{role.name}</AppLink>
              </Td>
              <Td dataLabel={compoundRolesCells[1]}>{role.description}</Td>
              <Td dataLabel={compoundRolesCells[2]}>
                <DateFormat date={role.modified} type={getDateFormat(role.modified)} />
              </Td>
            </Tr>
          ))
        ) : (
          <Tr>
            <Td colSpan={compoundRolesCells.length}>
              <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{intl.formatMessage(messages.noGroupRoles)}</Text>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  );
};
