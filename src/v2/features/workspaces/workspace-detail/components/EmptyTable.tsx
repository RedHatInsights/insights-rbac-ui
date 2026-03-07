import React from 'react';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';

interface EmptyTableProps {
  titleText: string;
  bodyText?: string;
}

export const EmptyTable: React.FC<EmptyTableProps> = ({
  titleText,
  bodyText = 'No user groups match the filter criteria. Remove all filters or clear all to show results.',
}) => (
  <tbody>
    <tr>
      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
        <EmptyState headingLevel="h4" icon={SearchIcon} titleText={titleText}>
          <EmptyStateBody>{bodyText}</EmptyStateBody>
        </EmptyState>
      </td>
    </tr>
  </tbody>
);
