import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { SearchIcon } from '@patternfly/react-icons/dist/dynamic/icons/search-icon';
import { useIntl } from 'react-intl';
import messages from '../../../../../Messages';

export interface GroupMembersEmptyStateProps {
  /** Whether there are active filters applied */
  hasActiveFilters?: boolean;
}

/**
 * Empty state component for GroupMembers table
 */
export const GroupMembersEmptyState: React.FC<GroupMembersEmptyStateProps> = ({ hasActiveFilters = false }) => {
  const intl = useIntl();

  return (
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
  );
};
