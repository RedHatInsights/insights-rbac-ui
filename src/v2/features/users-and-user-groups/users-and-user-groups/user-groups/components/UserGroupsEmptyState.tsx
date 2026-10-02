import React from 'react';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { SearchIcon } from '@patternfly/react-icons/dist/dynamic/icons/search-icon';
import { useIntl } from 'react-intl';
import { commonMessages } from '../../../../../../shared/messages/common';

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
    <EmptyState
      headingLevel="h4"
      icon={SearchIcon}
      titleText={
        hasActiveFilters
          ? intl.formatMessage(commonMessages.noMatchingItemsFound, { items: intl.formatMessage(commonMessages.userGroups).toLowerCase() })
          : titleText ||
            intl.formatMessage({
              id: 'userGroupsEmptyStateTitle',
              defaultMessage: 'No user group found',
              description: 'Empty state title User groups',
            })
      }
    >
      <EmptyStateBody>
        {hasActiveFilters
          ? `${intl.formatMessage(commonMessages.filterMatchesNoItems, { items: intl.formatMessage(commonMessages.userGroups).toLowerCase() })} ${intl.formatMessage(commonMessages.tryChangingFilters)}`
          : intl.formatMessage({
              id: 'userGroupsEmptyStateSubtitle',
              defaultMessage: 'This filter criteria matches no user groups. Try changing your filter input.',
              description: 'Empty state subtitle User groups',
            })}
      </EmptyStateBody>
    </EmptyState>
  );
};
