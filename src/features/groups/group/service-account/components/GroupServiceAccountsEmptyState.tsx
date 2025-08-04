import React from 'react';
import { useIntl } from 'react-intl';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';

import messages from '../../../../../Messages';

interface GroupServiceAccountsEmptyStateProps {
  titleText: string;
  descriptionText: string;
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
  onAddServiceAccount?: () => void;
  canAdd?: boolean;
}

export const GroupServiceAccountsEmptyState: React.FC<GroupServiceAccountsEmptyStateProps> = ({
  titleText,
  descriptionText,
  hasActiveFilters,
  onClearFilters,
  onAddServiceAccount,
  canAdd = false,
}) => {
  const intl = useIntl();

  return (
    <tr>
      <td colSpan={4}>
        <Bullseye>
          <EmptyState variant={EmptyStateVariant.sm}>
            <EmptyStateHeader titleText={titleText} icon={<EmptyStateIcon icon={SearchIcon} />} headingLevel="h4" />
            <EmptyStateBody>{descriptionText}</EmptyStateBody>
            {(hasActiveFilters || canAdd) && (
              <EmptyStateFooter>
                <EmptyStateActions>
                  {hasActiveFilters && onClearFilters && (
                    <Button variant="link" onClick={onClearFilters}>
                      {intl.formatMessage(messages.clearAllFilters)}
                    </Button>
                  )}
                  {canAdd && onAddServiceAccount && (
                    <Button variant="primary" onClick={onAddServiceAccount}>
                      {intl.formatMessage(messages.addServiceAccount)}
                    </Button>
                  )}
                </EmptyStateActions>
              </EmptyStateFooter>
            )}
          </EmptyState>
        </Bullseye>
      </td>
    </tr>
  );
};
