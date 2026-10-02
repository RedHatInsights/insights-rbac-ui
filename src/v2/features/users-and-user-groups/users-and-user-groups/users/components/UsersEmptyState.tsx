import React from 'react';
import { useIntl } from 'react-intl';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { SearchIcon } from '@patternfly/react-icons/dist/dynamic/icons/search-icon';

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
    <tbody>
      <tr>
        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
          <EmptyState
            headingLevel="h4"
            icon={SearchIcon}
            titleText={
              titleText ||
              intl.formatMessage({ id: 'usersEmptyStateTitle', defaultMessage: 'No users found', description: 'Empty state title Users' })
            }
          >
            <EmptyStateBody>
              {intl.formatMessage({
                id: 'usersEmptyStateSubtitle',
                defaultMessage: 'This filter criteria matches no users. Try changing your filter input.',
                description: 'Empty state subtitle Users',
              })}
            </EmptyStateBody>
          </EmptyState>
        </td>
      </tr>
    </tbody>
  );
};
