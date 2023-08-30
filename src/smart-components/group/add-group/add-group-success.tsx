import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import { Title, Button, EmptyState, EmptyStateVariant, EmptyStateIcon, EmptyStateSecondaryActions } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { AddGroupWizardContext } from './add-group-wizard';
import messages from '../../../Messages';

interface AddGroupSuccessProps {
  onClose: () => void;
}

const AddGroupSuccess = ({ onClose }: AddGroupSuccessProps) => {
  const intl = useIntl();
  const { setHideForm, setWizardSuccess } = useContext(AddGroupWizardContext);

  return (
    <EmptyState variant={EmptyStateVariant.large}>
      <EmptyStateIcon className="pf-u-mt-xl" color="green" icon={CheckCircleIcon} />
      <Title headingLevel="h4" size="lg">
        {intl.formatMessage(messages.groupCreatedSuccessfully)}
      </Title>
      <Button onClick={onClose} variant="primary">
        {intl.formatMessage(messages.exit)}
      </Button>
      <EmptyStateSecondaryActions>
        <Button
          onClick={() => {
            setHideForm(false);
            setWizardSuccess(false);
          }}
          variant="link"
        >
          {intl.formatMessage(messages.createAnotherGroup)}
        </Button>
      </EmptyStateSecondaryActions>
    </EmptyState>
  );
};

export default AddGroupSuccess;
