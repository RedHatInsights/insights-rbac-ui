import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { SearchIcon } from '@patternfly/react-icons/dist/dynamic/icons/search-icon';
import { useIntl } from 'react-intl';
import messages from '../../../../../Messages';

export interface UserGroupsEmptyStateProps {
  /** Whether there are active filters applied */
  hasActiveFilters?: boolean;
  /** Optional custom title text. If not provided, uses default localized message */
  titleText?: string;
}

/**
 * Empty state component for UserGroups table
 */
export const UserGroupsEmptyState: React.FC<UserGroupsEmptyStateProps> = ({ hasActiveFilters = false, titleText }) => {
  const intl = useIntl();

  return (
    <EmptyState>
      <EmptyStateHeader
        titleText={
          hasActiveFilters
            ? intl.formatMessage(messages.noMatchingItemsFound, { items: intl.formatMessage(messages.userGroups).toLowerCase() })
            : titleText || intl.formatMessage(messages.userGroupsEmptyStateTitle)
        }
        headingLevel="h4"
        icon={<EmptyStateIcon icon={SearchIcon} />}
      />
      <EmptyStateBody>
        {hasActiveFilters
          ? `${intl.formatMessage(messages.filterMatchesNoItems, { items: intl.formatMessage(messages.userGroups).toLowerCase() })} ${intl.formatMessage(messages.tryChangingFilters)}`
          : intl.formatMessage(messages.userGroupsEmptyStateSubtitle)}
      </EmptyStateBody>
    </EmptyState>
  );
};
