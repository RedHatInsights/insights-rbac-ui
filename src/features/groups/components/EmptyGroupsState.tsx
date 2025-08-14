import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon } from '@patternfly/react-core';
import { SearchIcon, UsersIcon } from '@patternfly/react-icons';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import type { EmptyGroupsStateProps } from '../types';

export const EmptyGroupsState: React.FC<EmptyGroupsStateProps> = ({ hasActiveFilters }) => {
  const intl = useIntl();

  if (hasActiveFilters) {
    // Empty state with active filters
    return (
      <EmptyState>
        <EmptyStateHeader titleText="No groups found" headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
        <EmptyStateBody>No groups match the filter criteria. Remove all filters or clear all to show results.</EmptyStateBody>
      </EmptyState>
    );
  }

  // Empty state with no data
  return (
    <EmptyState>
      <EmptyStateHeader titleText="Configure groups" headingLevel="h4" icon={<EmptyStateIcon icon={UsersIcon} />} />
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
