import React from 'react';
import { useIntl } from 'react-intl';
import { Table, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { SkeletonTableBody } from '@patternfly/react-component-groups';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon';
import CloseIcon from '@patternfly/react-icons/dist/js/icons/close-icon';
import messages from '../../../Messages';
import type { Group } from '../types';

interface GroupsMembersTableProps {
  group: Group;
}

export const GroupsMembersTable: React.FC<GroupsMembersTableProps> = ({ group }) => {
  const intl = useIntl();

  const compoundMembersCells = [
    intl.formatMessage(messages.orgAdmin),
    intl.formatMessage(messages.firstName),
    intl.formatMessage(messages.lastName),
    intl.formatMessage(messages.username),
    intl.formatMessage(messages.email),
    intl.formatMessage(messages.status),
  ];

  if (!group.members || group.isLoadingMembers) {
    return (
      <Table aria-label={`Members for ${group.name}`} variant={TableVariant.compact} ouiaId={`compound-members-${group.uuid}`}>
        <Thead>
          <Tr>
            {compoundMembersCells.map((cell, index) => (
              <Th key={index}>{cell}</Th>
            ))}
          </Tr>
        </Thead>
        <SkeletonTableBody rowsCount={3} columnsCount={compoundMembersCells.length} />
      </Table>
    );
  }

  return (
    <Table aria-label={`Members for ${group.name}`} variant={TableVariant.compact} ouiaId={`compound-members-${group.uuid}`}>
      <Thead>
        <Tr>
          {compoundMembersCells.map((cell, index) => (
            <Th key={index}>{cell}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {group.members.length > 0 ? (
          group.members.map((member: any, index: number) => (
            <Tr key={`${group.uuid}-member-${member.username || member.email || index}`}>
              <Td dataLabel={compoundMembersCells[0]}>
                <TextContent>
                  {member?.is_org_admin ? (
                    <CheckIcon key="yes-icon" className="pf-v5-u-mx-sm" />
                  ) : (
                    <CloseIcon key="no-icon" className="pf-v5-u-mx-sm" />
                  )}
                  {intl.formatMessage(member?.is_org_admin ? messages.yes : messages.no)}
                </TextContent>
              </Td>
              <Td dataLabel={compoundMembersCells[1]}>{member.first_name}</Td>
              <Td dataLabel={compoundMembersCells[2]}>{member.last_name}</Td>
              <Td dataLabel={compoundMembersCells[3]}>{member.username}</Td>
              <Td dataLabel={compoundMembersCells[4]}>{member.email}</Td>
              <Td dataLabel={compoundMembersCells[5]}>{member.is_active ? 'Active' : 'Inactive'}</Td>
            </Tr>
          ))
        ) : (
          <Tr>
            <Td colSpan={compoundMembersCells.length}>
              <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{intl.formatMessage(messages.noGroupMembers)}</Text>
            </Td>
          </Tr>
        )}
      </Tbody>
    </Table>
  );
};
