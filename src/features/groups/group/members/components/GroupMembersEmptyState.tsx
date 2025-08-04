import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Tbody, Td, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { SearchIcon } from '@patternfly/react-icons/dist/dynamic/icons/search-icon';
import { useIntl } from 'react-intl';
import messages from '../../../../../Messages';

export interface GroupMembersEmptyStateProps {
  /** Number of columns in the table for proper colSpan */
  colSpan: number;
  /** Whether there are active filters applied */
  hasActiveFilters?: boolean;
}

/**
 * Empty state component for GroupMembers table, properly wrapped for table layout
 */
export const GroupMembersEmptyState: React.FC<GroupMembersEmptyStateProps> = ({ colSpan, hasActiveFilters = false }) => {
  const intl = useIntl();

  return (
    <Tbody>
      <Tr>
        <Td colSpan={colSpan}>
          <EmptyState>
            <EmptyStateHeader
              titleText={
                hasActiveFilters
                  ? intl.formatMessage(messages.noMatchingItemsFound, { items: intl.formatMessage(messages.members).toLowerCase() })
                  : intl.formatMessage(messages.noGroupMembers)
              }
              headingLevel="h4"
              icon={<EmptyStateIcon icon={SearchIcon} />}
            />
            <EmptyStateBody>
              {hasActiveFilters
                ? `${intl.formatMessage(messages.filterMatchesNoItems, { items: intl.formatMessage(messages.members).toLowerCase() })} ${intl.formatMessage(messages.tryChangingFilters)}`
                : intl.formatMessage(messages.addUserToConfigure)}
            </EmptyStateBody>
          </EmptyState>
        </Td>
      </Tr>
    </Tbody>
  );
};
