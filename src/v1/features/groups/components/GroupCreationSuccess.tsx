import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { EmptyState, EmptyStateActions, EmptyStateFooter, EmptyStateVariant } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import React from 'react';
import { useIntl } from 'react-intl';

interface GroupCreationSuccessProps {
  onClose: () => void;
  onCreateAnother?: () => void;
}

export const GroupCreationSuccess: React.FC<GroupCreationSuccessProps> = ({ onClose, onCreateAnother }) => {
  const intl = useIntl();
  return (
    <EmptyState
      headingLevel="h4"
      icon={CheckCircleIcon}
      titleText={
        <>
          {intl.formatMessage({
            id: 'groupCreatedSuccessfully',
            defaultMessage: 'You have successfully created a new group',
            description: 'Group created successfully message',
          })}
        </>
      }
      variant={EmptyStateVariant.lg}
    >
      <EmptyStateFooter>
        <Button onClick={onClose} variant="primary">
          {intl.formatMessage({ id: 'exit', defaultMessage: 'Exit', description: 'Exit button text' })}
        </Button>
        {onCreateAnother && (
          <EmptyStateActions>
            <Button onClick={onCreateAnother} variant="link">
              {intl.formatMessage({ id: 'createAnotherGroup', defaultMessage: 'Create another group', description: 'Create another group message' })}
            </Button>
          </EmptyStateActions>
        )}
      </EmptyStateFooter>
    </EmptyState>
  );
};
