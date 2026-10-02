import React from 'react';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';

import { EmptyStateFooter } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateActions } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon';
import { useIntl } from 'react-intl';
import { AppLink } from '../../../../shared/components/navigation/AppLink';

import pathnames from '../../../utilities/pathnames';
import { commonMessages } from '../../../../shared/messages/common';

interface RolesEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
}

interface RolesEmptyStateFullProps extends RolesEmptyStateProps {
  isAdmin?: boolean;
  addRoleLink?: string;
}

export const RolesEmptyState: React.FC<RolesEmptyStateFullProps> = ({
  hasActiveFilters,
  isAdmin = false,
  onClearFilters,
  addRoleLink = pathnames['access-management-add-role'].link(),
}) => {
  const intl = useIntl();

  if (hasActiveFilters) {
    // Empty state with active filters
    return (
      <Bullseye>
        <EmptyState headingLevel="h4" icon={SearchIcon} titleText={intl.formatMessage(commonMessages.noRolesFound)}>
          <EmptyStateBody>
            {intl.formatMessage({
              id: 'noFilteredRoles',
              defaultMessage: 'No roles match the filter criteria. Remove all filters or clear all to show results.',
              description: 'Empty state body when no roles match filters',
            })}
          </EmptyStateBody>
          {onClearFilters && (
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="link" onClick={onClearFilters}>
                  {intl.formatMessage({ id: 'clearAllFilters', defaultMessage: 'Clear all filters', description: 'Clear all filters message' })}
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          )}
        </EmptyState>
      </Bullseye>
    );
  }

  // Empty state with no data
  return (
    <Bullseye>
      <EmptyState
        headingLevel="h4"
        icon={CubesIcon}
        titleText={intl.formatMessage({
          id: 'configureRoles',
          defaultMessage: 'Configure roles',
          description: 'Empty state title when no roles exist',
        })}
      >
        <EmptyStateBody>
          {intl.formatMessage(commonMessages.toConfigureUserAccess)}{' '}
          {intl.formatMessage(commonMessages.createAtLeastOneItem, {
            item: intl.formatMessage(commonMessages.role).toLowerCase(),
          })}
          .
        </EmptyStateBody>
        {isAdmin && (
          <EmptyStateFooter>
            <EmptyStateActions>
              <AppLink to={addRoleLink}>
                <Button variant="primary" aria-label={intl.formatMessage(commonMessages.createRole)}>
                  {intl.formatMessage(commonMessages.createRole)}
                </Button>
              </AppLink>
            </EmptyStateActions>
          </EmptyStateFooter>
        )}
      </EmptyState>
    </Bullseye>
  );
};
