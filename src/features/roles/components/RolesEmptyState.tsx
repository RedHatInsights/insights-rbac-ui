import React from 'react';
import { Tbody } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Td } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
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
  colSpan: number;
  isAdmin?: boolean;
}

export const RolesEmptyState: React.FC<RolesEmptyStateFullProps> = ({ colSpan, hasActiveFilters, isAdmin = false, onClearFilters }) => {
  const intl = useIntl();

  if (hasActiveFilters) {
    // Empty state with active filters
    return (
      <Tbody>
        <Tr>
          <Td colSpan={colSpan}>
            <Bullseye>
              <EmptyState>
                <EmptyStateHeader
                  titleText={intl.formatMessage(messages.noRolesFound)}
                  headingLevel="h4"
                  icon={<EmptyStateIcon icon={SearchIcon} />}
                />
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
          </Td>
        </Tr>
      </Tbody>
    );
  }

  // Empty state with no data
  return (
    <Tbody>
      <Tr>
        <Td colSpan={colSpan}>
          <Bullseye>
            <EmptyState>
              <EmptyStateHeader
                titleText={intl.formatMessage(messages.configureRoles)}
                headingLevel="h4"
                icon={<EmptyStateIcon icon={CubesIcon} />}
              />
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
                    <AppLink to={pathnames['add-role'].link}>
                      <Button variant="primary" aria-label={intl.formatMessage(messages.createRole)}>
                        {intl.formatMessage(messages.createRole)}
                      </Button>
                    </AppLink>
                  </EmptyStateActions>
                </EmptyStateFooter>
              )}
            </EmptyState>
          </Bullseye>
        </Td>
      </Tr>
    </Tbody>
  );
};
