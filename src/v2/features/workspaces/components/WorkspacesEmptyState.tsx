import React from 'react';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { SearchIcon } from '@patternfly/react-icons/dist/dynamic/icons/search-icon';
import { FormattedMessage, useIntl } from 'react-intl';

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
    <EmptyState
      headingLevel="h4"
      icon={SearchIcon}
      titleText={
        titleText ||
        intl.formatMessage({ id: 'workspaceEmptyStateTitle', defaultMessage: 'No workspaces found', description: 'Empty State Title Workspaces' })
      }
    >
      <EmptyStateBody>
        {subtitleContent || (
          <FormattedMessage
            id={'workspaceEmptyStateSubtitle'}
            defaultMessage={'This filter criteria matches no workspaces. Try changing your filter input.'}
            description={'Empty State Subtitle Workspaces'}
          />
        )}
      </EmptyStateBody>
    </EmptyState>
  );
};
