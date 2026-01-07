import React from 'react';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import type { EmptyGroupsStateProps } from '../types';

export const EmptyGroupsState: React.FC<EmptyGroupsStateProps> = ({ hasActiveFilters }) => {
  const intl = useIntl();

  if (hasActiveFilters) {
    // Empty state with active filters
    return (
      <EmptyState headingLevel="h4" icon={SearchIcon} titleText="No groups found">
        <EmptyStateBody>No groups match the filter criteria. Remove all filters or clear all to show results.</EmptyStateBody>
      </EmptyState>
    );
  }

  // Empty state with no data
  return (
    <EmptyState headingLevel="h4" icon={UsersIcon} titleText="Configure groups">
      <EmptyStateBody>
        {intl.formatMessage(messages.toConfigureUserAccess)}{' '}
        {intl.formatMessage(messages.createAtLeastOneItem, {
          item: intl.formatMessage(messages.group).toLowerCase(),
        })}
        .
      </EmptyStateBody>
    </EmptyState>
  );
};
