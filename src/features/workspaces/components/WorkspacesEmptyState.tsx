import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { SearchIcon } from '@patternfly/react-icons/dist/dynamic/icons/search-icon';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../Messages';

export interface WorkspacesEmptyStateProps {
  /** Optional custom title text. If not provided, uses default localized message */
  titleText?: string;
  /** Optional custom subtitle content. If not provided, uses default formatted message */
  subtitleContent?: React.ReactNode;
}

/**
 * Empty state component for Workspaces table with custom subtitle formatting
 */
export const WorkspacesEmptyState: React.FC<WorkspacesEmptyStateProps> = ({ titleText, subtitleContent }) => {
  const intl = useIntl();

  return (
    <EmptyState>
      <EmptyStateHeader
        titleText={titleText || intl.formatMessage(messages.workspaceEmptyStateTitle)}
        headingLevel="h4"
        icon={<EmptyStateIcon icon={SearchIcon} />}
      />
      <EmptyStateBody>
        {subtitleContent || (
          <FormattedMessage
            {...messages['workspaceEmptyStateSubtitle']}
            values={{
              br: <br />,
            }}
          />
        )}
      </EmptyStateBody>
    </EmptyState>
  );
};
