import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState, EmptyStateActions, EmptyStateFooter, EmptyStateVariant } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import React from 'react';
import { useIntl } from 'react-intl';

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
      titleText={
        <>
          {intl.formatMessage({
            id: 'roleCreatedSuccessfully',
            defaultMessage: 'You have successfully created a new role',
            description: 'Role created successfully message',
          })}
        </>
      }
      variant={EmptyStateVariant.lg}
    >
      <EmptyStateFooter>
        <Button onClick={onClose} variant="primary">
          {intl.formatMessage({ id: 'exit', defaultMessage: 'Exit', description: 'Exit button text' })}
        </Button>
        {(onCreateAnother || onAddToGroup) && (
          <EmptyStateActions>
            {onCreateAnother && (
              <Button onClick={onCreateAnother} variant="link">
                {intl.formatMessage({ id: 'createAnotherRole', defaultMessage: 'Create another role', description: 'Create another role message' })}
              </Button>
            )}
            {onAddToGroup && (
              <Button onClick={onAddToGroup} variant="link">
                {intl.formatMessage({ id: 'addRoleToGroup', defaultMessage: 'Add role to group', description: 'Add role to group label' })}
              </Button>
            )}
          </EmptyStateActions>
        )}
      </EmptyStateFooter>
    </EmptyState>
  );
};
