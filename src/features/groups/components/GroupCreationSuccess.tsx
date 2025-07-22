import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
} from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import CheckCircleIcon from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

interface GroupCreationSuccessProps {
  onClose: () => void;
  onCreateAnother?: () => void;
}

export const GroupCreationSuccess: React.FC<GroupCreationSuccessProps> = ({ onClose, onCreateAnother }) => {
  const intl = useIntl();
  return (
    <EmptyState variant={EmptyStateVariant.lg}>
      <EmptyStateHeader
        titleText={<>{intl.formatMessage(messages.groupCreatedSuccessfully)}</>}
        icon={<EmptyStateIcon className="pf-v5-u-mt-xl" color="green" icon={CheckCircleIcon} />}
        headingLevel="h4"
      />
      <EmptyStateFooter>
        <Button onClick={onClose} variant="primary">
          {intl.formatMessage(messages.exit)}
        </Button>
        {onCreateAnother && (
          <EmptyStateActions>
            <Button onClick={onCreateAnother} variant="link">
              {intl.formatMessage(messages.createAnotherGroup)}
            </Button>
          </EmptyStateActions>
        )}
      </EmptyStateFooter>
    </EmptyState>
  );
};
