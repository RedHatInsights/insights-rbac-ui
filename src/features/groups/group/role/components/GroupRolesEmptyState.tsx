import React from 'react';
import { Bullseye } from '@patternfly/react-core';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';

interface GroupRolesEmptyStateProps {
  hasActiveFilters: boolean;
  title: string;
  description: string;
}

export const GroupRolesEmptyState: React.FC<GroupRolesEmptyStateProps> = ({ hasActiveFilters, title, description }) => {
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
        <EmptyStateHeader titleText={title} icon={<EmptyStateIcon icon={CubesIcon} />} headingLevel="h2" />
        <EmptyStateBody>{description}</EmptyStateBody>
      </EmptyState>
    </Bullseye>
  );
};
