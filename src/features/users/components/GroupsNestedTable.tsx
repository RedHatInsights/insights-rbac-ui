import React from 'react';
import { useIntl } from 'react-intl';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { TableVariant } from '@patternfly/react-table';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { AppLink } from '../../../components/navigation/AppLink';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';

interface GroupIn {
  uuid: string;
  name: string;
  description?: string;
}

interface AdminGroup {
  uuid: string;
  name: string;
  description?: string;
}

interface GroupsNestedTableProps {
  groups: GroupIn[];
  username: string;
  adminGroup?: AdminGroup;
  isLoading?: boolean;
}

export const GroupsNestedTable: React.FC<GroupsNestedTableProps> = ({ groups, username, adminGroup, isLoading }) => {
  const intl = useIntl();

  if (isLoading) {
    return <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{intl.formatMessage(messages.loading)}</Text>;
  }

  if (!groups || groups.length === 0) {
    return <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{intl.formatMessage(messages.noGroups)}</Text>;
  }

  return (
    <Table aria-label="Groups table" ouiaId="groups-in-role-nested-table" variant={TableVariant.compact}>
      <Thead>
        <Tr>
          <Th>{intl.formatMessage(messages.name)}</Th>
          <Th>{intl.formatMessage(messages.description)}</Th>
          <Th />
        </Tr>
      </Thead>
      <Tbody>
        {groups
          .filter((group): group is GroupIn => Boolean(group))
          .map((group) => (
            <Tr key={group.uuid}>
              <Td dataLabel={intl.formatMessage(messages.name)}>
                <AppLink to={pathnames['group-detail'].link.replace(':groupId', group.uuid)}>{group.name}</AppLink>
              </Td>
              <Td dataLabel={intl.formatMessage(messages.description)}>{group.description}</Td>
              <Td className="pf-v5-u-text-align-right">
                {!adminGroup || !group.uuid || adminGroup.uuid === group.uuid ? null : (
                  <AppLink
                    to={pathnames['user-add-group-roles'].link.replace(':username', username).replace(':groupId', group.uuid)}
                    state={{ name: group.name }}
                  >
                    {intl.formatMessage(messages.addRoleToThisGroup)}
                  </AppLink>
                )}
              </Td>
            </Tr>
          ))}
      </Tbody>
    </Table>
  );
};

export default GroupsNestedTable;
