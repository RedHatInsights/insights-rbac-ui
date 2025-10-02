import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { SearchIcon } from '@patternfly/react-icons/dist/dynamic/icons/search-icon';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../Messages';

export interface RolesEmptyStateProps {
  /** Optional custom title text. If not provided, uses default localized message */
  titleText?: string;
  /** Optional custom subtitle content. If not provided, uses default formatted message */
  subtitleContent?: React.ReactNode;
}

/**
 * Empty state component for Roles table with custom subtitle formatting
 */
export const RolesEmptyState: React.FC<RolesEmptyStateProps> = ({ titleText, subtitleContent }) => {
  const intl = useIntl();

  return (
    <EmptyState>
      <EmptyStateHeader
        titleText={titleText || intl.formatMessage(messages.rolesEmptyStateTitle)}
        headingLevel="h4"
        icon={<EmptyStateIcon icon={SearchIcon} />}
      />
      <EmptyStateBody>
        {subtitleContent || (
          <FormattedMessage
            {...messages['rolesEmptyStateSubtitle']}
            values={{
              br: <br />,
            }}
          />
        )}
      </EmptyStateBody>
    </EmptyState>
  );
};
