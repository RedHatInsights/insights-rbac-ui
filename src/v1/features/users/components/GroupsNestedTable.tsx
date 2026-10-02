import React from 'react';
import { useIntl } from 'react-intl';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { TableVariant } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { AppLink } from '../../../../shared/components/navigation/AppLink';

import pathnames from '../../../utilities/pathnames';
import { commonMessages } from '../../../../shared/messages/common';

interface GroupIn {
  uuid?: string;
  name?: string;
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
    return (
      <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
        {intl.formatMessage(commonMessages.loading)}
      </Content>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <Content component="p" className="pf-v6-u-mx-lg pf-v6-u-my-sm">
        {intl.formatMessage({ id: 'noGroups', defaultMessage: 'No groups', description: 'No groups label' })}
      </Content>
    );
  }

  return (
    <Table aria-label="Groups table" ouiaId="groups-in-role-nested-table" variant={TableVariant.compact}>
      <Thead>
        <Tr>
          <Th>{intl.formatMessage(commonMessages.name)}</Th>
          <Th>{intl.formatMessage(commonMessages.description)}</Th>
          <Th screenReaderText="Actions" />
        </Tr>
      </Thead>
      <Tbody>
        {groups
          .filter((group): group is GroupIn => Boolean(group) && Boolean(group.uuid))
          .map((group) => (
            <Tr key={group.uuid}>
              <Td dataLabel={intl.formatMessage(commonMessages.name)}>
                <AppLink to={pathnames['group-detail'].link(group.uuid ?? '')}>{group.name}</AppLink>
              </Td>
              <Td dataLabel={intl.formatMessage(commonMessages.description)}>{group.description}</Td>
              <Td className="pf-v6-u-text-align-right">
                {!adminGroup || !group.uuid || adminGroup.uuid === group.uuid ? null : (
                  <AppLink to={pathnames['user-add-group-roles'].link(username, group.uuid ?? '')} state={{ name: group.name }}>
                    {intl.formatMessage({
                      id: 'addRoleToThisGroup',
                      defaultMessage: 'Add role to this group',
                      description: 'Add role to this group label',
                    })}
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
