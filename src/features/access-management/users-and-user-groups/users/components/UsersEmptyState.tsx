import React from 'react';
import { useIntl } from 'react-intl';
import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { SearchIcon } from '@patternfly/react-icons/dist/dynamic/icons/search-icon';
import messages from '../../../../../Messages';

export interface UsersEmptyStateProps {
  /** Optional custom title text. If not provided, uses default localized message */
  titleText?: string;
}

/**
 * Empty state component for Users table
 */
export const UsersEmptyState: React.FC<UsersEmptyStateProps> = ({ titleText }) => {
  const intl = useIntl();

  return (
    <EmptyState>
      <EmptyStateHeader
        titleText={titleText || intl.formatMessage(messages.usersEmptyStateTitle)}
        headingLevel="h4"
        icon={<EmptyStateIcon icon={SearchIcon} />}
      />
      <EmptyStateBody>{intl.formatMessage(messages.usersEmptyStateSubtitle)}</EmptyStateBody>
    </EmptyState>
  );
};
