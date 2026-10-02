import React from 'react';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { SearchIcon } from '@patternfly/react-icons/dist/dynamic/icons/search-icon';
import { useIntl } from 'react-intl';
import { commonMessages } from '../../../../../../shared/messages/common';

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
    <EmptyState
      headingLevel="h4"
      icon={SearchIcon}
      titleText={
        hasActiveFilters
          ? intl.formatMessage(commonMessages.noMatchingItemsFound, { items: intl.formatMessage(commonMessages.members).toLowerCase() })
          : intl.formatMessage({
              id: 'noGroupMembers',
              defaultMessage: 'There are no members in this group',
              description: 'No members in a given group title',
            })
      }
    >
      <EmptyStateBody>
        {hasActiveFilters
          ? `${intl.formatMessage(commonMessages.filterMatchesNoItems, { items: intl.formatMessage(commonMessages.members).toLowerCase() })} ${intl.formatMessage(commonMessages.tryChangingFilters)}`
          : intl.formatMessage({
              id: 'addUserToConfigure',
              defaultMessage: 'Add a user to configure user access.',
              description: 'Add a user to configure user access message',
            })}
      </EmptyStateBody>
    </EmptyState>
  );
};
