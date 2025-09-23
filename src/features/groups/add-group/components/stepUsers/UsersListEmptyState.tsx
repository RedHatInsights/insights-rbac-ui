import React from 'react';
import { Tbody } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Td } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Bullseye } from '@patternfly/react-core';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';

interface UsersListEmptyStateProps {
  colSpan: number;
  hasActiveFilters: boolean;
}

export const UsersListEmptyState: React.FC<UsersListEmptyStateProps> = ({ colSpan, hasActiveFilters }) => {
  if (hasActiveFilters) {
    return (
      <Tbody>
        <Tr>
          <Td colSpan={colSpan}>
            <Bullseye>
              <EmptyState>
                <EmptyStateHeader titleText="No users match your search" icon={<EmptyStateIcon icon={SearchIcon} />} headingLevel="h2" />
                <EmptyStateBody>Try adjusting your search filters to find the users you&apos;re looking for.</EmptyStateBody>
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
              <EmptyStateHeader titleText="No users found" headingLevel="h2" />
              <EmptyStateBody>No users match the current filter criteria.</EmptyStateBody>
            </EmptyState>
          </Bullseye>
        </Td>
      </Tr>
    </Tbody>
  );
};
