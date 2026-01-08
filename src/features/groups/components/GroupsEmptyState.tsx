import React from 'react';
import { EmptyState, EmptyStateActions, EmptyStateBody, EmptyStateFooter } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';
import { useIntl } from 'react-intl';
import { AppLink } from '../../../components/navigation/AppLink';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';

interface GroupsEmptyStateProps {
  hasActiveFilters: boolean;
  titleText?: string;
  isAdmin?: boolean;
}

export const GroupsEmptyState: React.FC<GroupsEmptyStateProps> = ({ hasActiveFilters, titleText, isAdmin = false }) => {
  const intl = useIntl();

  if (hasActiveFilters) {
    return (
      <EmptyState headingLevel="h4" icon={SearchIcon} titleText="No groups found">
        <EmptyStateBody>No groups match the filter criteria. Remove all filters or clear all to show results.</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <EmptyState headingLevel="h4" icon={UsersIcon} titleText={titleText || `Configure ${intl.formatMessage(messages.groups).toLowerCase()}`}>
      <EmptyStateBody>
        {intl.formatMessage(messages.toConfigureUserAccess)}{' '}
        {intl.formatMessage(messages.createAtLeastOneItem, {
          item: intl.formatMessage(messages.group).toLowerCase(),
        })}
        .
      </EmptyStateBody>
      {isAdmin && (
        <EmptyStateFooter>
          <EmptyStateActions>
            <AppLink to={pathnames['add-group'].link}>
              <Button variant="primary">{intl.formatMessage(messages.createGroup)}</Button>
            </AppLink>
          </EmptyStateActions>
        </EmptyStateFooter>
      )}
    </EmptyState>
  );
};
