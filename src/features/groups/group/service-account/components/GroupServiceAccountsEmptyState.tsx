import React from 'react';
import { Bullseye } from '@patternfly/react-core';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import ServiceCatalogIcon from '@patternfly/react-icons/dist/js/icons/service-catalog-icon';

interface GroupServiceAccountsEmptyStateProps {
  hasActiveFilters: boolean;
  title: string;
  description: string;
}

export const GroupServiceAccountsEmptyState: React.FC<GroupServiceAccountsEmptyStateProps> = ({ hasActiveFilters, title, description }) => {
  if (hasActiveFilters) {
    return (
      <Bullseye>
        <EmptyState headingLevel="h2" icon={SearchIcon} titleText="No service accounts match your search">
          <EmptyStateBody>Try adjusting your search filters to find the service accounts you&apos;re looking for.</EmptyStateBody>
        </EmptyState>
      </Bullseye>
    );
  }

  return (
    <Bullseye>
      <EmptyState headingLevel="h2" icon={ServiceCatalogIcon} titleText={title}>
        <EmptyStateBody>{description}</EmptyStateBody>
      </EmptyState>
    </Bullseye>
  );
};
