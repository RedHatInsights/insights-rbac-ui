import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState, EmptyStateActions, EmptyStateFooter, EmptyStateVariant } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

interface RoleCreationSuccessProps {
  onClose: () => void;
  onCreateAnother?: () => void;
  onAddToGroup?: () => void;
}

export const RoleCreationSuccess: React.FC<RoleCreationSuccessProps> = ({ onClose, onCreateAnother, onAddToGroup }) => {
  const intl = useIntl();
  return (
    <EmptyState
      headingLevel="h4"
      icon={CheckCircleIcon}
      titleText={<>{intl.formatMessage(messages.roleCreatedSuccessfully)}</>}
      variant={EmptyStateVariant.lg}
    >
      <EmptyStateFooter>
        <Button onClick={onClose} variant="primary">
          {intl.formatMessage(messages.exit)}
        </Button>
        {(onCreateAnother || onAddToGroup) && (
          <EmptyStateActions>
            {onCreateAnother && (
              <Button onClick={onCreateAnother} variant="link">
                {intl.formatMessage(messages.createAnotherRole)}
              </Button>
            )}
            {onAddToGroup && (
              <Button onClick={onAddToGroup} variant="link">
                {intl.formatMessage(messages.addRoleToGroup)}
              </Button>
            )}
          </EmptyStateActions>
        )}
      </EmptyStateFooter>
    </EmptyState>
  );
};
