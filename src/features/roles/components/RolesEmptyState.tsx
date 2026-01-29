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
import { AppLink } from '../../../components/navigation/AppLink';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';
import type { RolesEmptyStateProps } from '../types';

interface RolesEmptyStateFullProps extends RolesEmptyStateProps {
  isAdmin?: boolean;
  addRoleLink?: string;
}

export const RolesEmptyState: React.FC<RolesEmptyStateFullProps> = ({
  hasActiveFilters,
  isAdmin = false,
  onClearFilters,
  addRoleLink = pathnames['add-role'].link(),
}) => {
  const intl = useIntl();

  if (hasActiveFilters) {
    // Empty state with active filters
    return (
      <Bullseye>
        <EmptyState headingLevel="h4" icon={SearchIcon} titleText={intl.formatMessage(messages.noRolesFound)}>
          <EmptyStateBody>{intl.formatMessage(messages.noFilteredRoles)}</EmptyStateBody>
          {onClearFilters && (
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="link" onClick={onClearFilters}>
                  {intl.formatMessage(messages.clearAllFilters)}
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
      <EmptyState headingLevel="h4" icon={CubesIcon} titleText={intl.formatMessage(messages.configureRoles)}>
        <EmptyStateBody>
          {intl.formatMessage(messages.toConfigureUserAccess)}{' '}
          {intl.formatMessage(messages.createAtLeastOneItem, {
            item: intl.formatMessage(messages.role).toLowerCase(),
          })}
          .
        </EmptyStateBody>
        {isAdmin && (
          <EmptyStateFooter>
            <EmptyStateActions>
              <AppLink to={addRoleLink}>
                <Button variant="primary" aria-label={intl.formatMessage(messages.createRole)}>
                  {intl.formatMessage(messages.createRole)}
                </Button>
              </AppLink>
            </EmptyStateActions>
          </EmptyStateFooter>
        )}
      </EmptyState>
    </Bullseye>
  );
};
