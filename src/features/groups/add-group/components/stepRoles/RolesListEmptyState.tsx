import React from 'react';
import { Bullseye } from '@patternfly/react-core';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';

interface RolesListEmptyStateProps {
  hasActiveFilters: boolean;
}

export const RolesListEmptyState: React.FC<RolesListEmptyStateProps> = ({ hasActiveFilters }) => {
  if (hasActiveFilters) {
    return (
      <Bullseye>
        <EmptyState headingLevel="h2" icon={SearchIcon} titleText="No roles match your search">
          <EmptyStateBody>Try adjusting your search filters to find the roles you&apos;re looking for.</EmptyStateBody>
        </EmptyState>
      </Bullseye>
    );
  }

  return (
    <Bullseye>
      <EmptyState headingLevel="h2" titleText="No roles available">
        <EmptyStateBody>There are no roles available to select from.</EmptyStateBody>
      </EmptyState>
    </Bullseye>
  );
};
