import React from 'react';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
} from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';
import { useIntl } from 'react-intl';
import { AppLink } from '../../../components/navigation/AppLink';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';

interface GroupsEmptyStateProps {
  hasActiveFilters: boolean;
  titleText?: string;
  isAdmin?: boolean;
}

export const GroupsEmptyState: React.FC<GroupsEmptyStateProps> = ({ hasActiveFilters, titleText, isAdmin = false }) => {
  const intl = useIntl();
  const colSpan = 5 + (isAdmin ? 1 : 0); // 5 columns (Name, Roles, Members, Modified, Actions) + Selection if admin

  const emptyStateContent = hasActiveFilters ? (
    <EmptyState>
      <EmptyStateHeader titleText="No groups found" headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
      <EmptyStateBody>No groups match the filter criteria. Remove all filters or clear all to show results.</EmptyStateBody>
    </EmptyState>
  ) : (
    <EmptyState>
      <EmptyStateHeader
        titleText={titleText || `Configure ${intl.formatMessage(messages.groups).toLowerCase()}`}
        headingLevel="h4"
        icon={<EmptyStateIcon icon={UsersIcon} />}
      />
      <EmptyStateBody>
        {intl.formatMessage(messages.toConfigureUserAccess)}{' '}
        {intl.formatMessage(messages.createAtLeastOneItem, {
          item: intl.formatMessage(messages.group).toLowerCase(),
        })}
        .
      </EmptyStateBody>
      {isAdmin && (
        <EmptyStateFooter>
          <EmptyStateActions>
            <AppLink to={pathnames['add-group'].link}>
              <Button variant="primary">{intl.formatMessage(messages.createGroup)}</Button>
            </AppLink>
          </EmptyStateActions>
        </EmptyStateFooter>
      )}
    </EmptyState>
  );

  return (
    <Table role="grid" aria-label="Empty groups">
      <Thead>
        <Tr>
          {isAdmin && <Th screenReaderText="Row selection" />}
          <Th>{intl.formatMessage(messages.name)}</Th>
          <Th>{intl.formatMessage(messages.roles)}</Th>
          <Th>{intl.formatMessage(messages.members)}</Th>
          <Th>{intl.formatMessage(messages.lastModified)}</Th>
          <Th screenReaderText="Row actions" />
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td colSpan={colSpan}>{emptyStateContent}</Td>
        </Tr>
      </Tbody>
    </Table>
  );
};
