import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon } from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';

interface EmptyTableProps {
  titleText: string;
  bodyText?: string;
}

export const EmptyTable: React.FC<EmptyTableProps> = ({
  titleText,
  bodyText = 'No user groups match the filter criteria. Remove all filters or clear all to show results.',
}) => (
  <EmptyState>
    <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
    <EmptyStateBody>{bodyText}</EmptyStateBody>
  </EmptyState>
);
