import React from 'react';
import { Tbody } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Td } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Bullseye } from '@patternfly/react-core';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';

interface GroupRolesEmptyStateProps {
  colSpan: number;
  hasActiveFilters: boolean;
  title: string;
  description: string;
}

export const GroupRolesEmptyState: React.FC<GroupRolesEmptyStateProps> = ({ colSpan, hasActiveFilters, title, description }) => {
  if (hasActiveFilters) {
    return (
      <Tbody>
        <Tr>
          <Td colSpan={colSpan}>
            <Bullseye>
              <EmptyState>
                <EmptyStateHeader titleText="No roles match your search" icon={<EmptyStateIcon icon={SearchIcon} />} headingLevel="h2" />
                <EmptyStateBody>Try adjusting your search filters to find the roles you&apos;re looking for.</EmptyStateBody>
              </EmptyState>
            </Bullseye>
          </Td>
        </Tr>
      </Tbody>
    );
  }

  return (
    <Tbody>
      <Tr>
        <Td colSpan={colSpan}>
          <Bullseye>
            <EmptyState>
              <EmptyStateHeader titleText={title} icon={<EmptyStateIcon icon={CubesIcon} />} headingLevel="h2" />
              <EmptyStateBody>{description}</EmptyStateBody>
            </EmptyState>
          </Bullseye>
        </Td>
      </Tr>
    </Tbody>
  );
};
