import React from 'react';
import { Bullseye } from '@patternfly/react-core';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';

interface RolesListEmptyStateProps {
  hasActiveFilters: boolean;
}

export const RolesListEmptyState: React.FC<RolesListEmptyStateProps> = ({ hasActiveFilters }) => {
  if (hasActiveFilters) {
    return (
      <Bullseye>
        <EmptyState>
          <EmptyStateHeader titleText="No roles match your search" icon={<EmptyStateIcon icon={SearchIcon} />} headingLevel="h2" />
          <EmptyStateBody>Try adjusting your search filters to find the roles you&apos;re looking for.</EmptyStateBody>
        </EmptyState>
      </Bullseye>
    );
  }

  return (
    <Bullseye>
      <EmptyState>
        <EmptyStateHeader titleText="No roles available" headingLevel="h2" />
        <EmptyStateBody>There are no roles available to select from.</EmptyStateBody>
      </EmptyState>
    </Bullseye>
  );
};
