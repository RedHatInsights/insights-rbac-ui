import React from 'react';
import { useIntl } from 'react-intl';
import { Table, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { SkeletonTableBody } from '@patternfly/react-component-groups';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { AppLink } from '../../../components/navigation/AppLink';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import { getDateFormat } from '../../../helpers/stringUtilities';
import { useGroupRolesQuery } from '../../../data/queries/groups';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';
import type { Group } from '../types';

interface GroupsRolesTableProps {
  group: Group;
}

/**
 * GroupsRolesTable - Fetches and displays roles for a group.
 * Uses React Query to fetch data automatically when rendered.
 */
export const GroupsRolesTable: React.FC<GroupsRolesTableProps> = ({ group }) => {
  const intl = useIntl();

  // Fetch roles via React Query (expanded view - fetch all for display)
  const { data, isLoading } = useGroupRolesQuery(group.uuid, { limit: 100 });
  const roles = data?.roles ?? [];

  const compoundRolesCells = [
    intl.formatMessage(messages.roleName),
    intl.formatMessage(messages.description),
    intl.formatMessage(messages.lastModified),
  ];

  if (isLoading) {
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
        {roles.length > 0 ? (
          roles.map((role, index) => (
            <Tr key={`${group.uuid}-role-${role.uuid || index}`}>
              <Td dataLabel={compoundRolesCells[0]}>
                <AppLink to={pathnames['role-detail'].link.replace(':roleId', role.uuid)}>{role.name}</AppLink>
              </Td>
              <Td dataLabel={compoundRolesCells[1]}>{role.description}</Td>
              <Td dataLabel={compoundRolesCells[2]}>
                {role.modified ? <DateFormat date={role.modified} type={getDateFormat(role.modified)} /> : '—'}
              </Td>
            </Tr>
          ))
        ) : (
          <Tr>
            <Td colSpan={compoundRolesCells.length}>
              <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
                {intl.formatMessage(messages.noGroupRoles)}
              </Content>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  );
};
