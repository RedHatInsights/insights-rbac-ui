import React, { useContext } from 'react';
import { Title, Button, EmptyState, EmptyStateVariant, EmptyStateIcon, EmptyStateBody } from '@patternfly/react-core';
import WizardContext from '@data-driven-forms/react-form-renderer/dist/esm/wizard-context';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { AddRoleWizardContext } from './add-role-wizard';

const AddRoleError = () => {
  const { jumpToStep } = useContext(WizardContext);
  const { setWizardError } = useContext(AddRoleWizardContext);
  return (
    <EmptyState variant={EmptyStateVariant.large}>
      <EmptyStateIcon color="red" icon={ExclamationCircleIcon} />
      <Title headingLevel="h4" size="lg">
        Role name already taken
      </Title>
      <EmptyStateBody>Please return to Step 1: Create role and choose a unique role name for your custom role.</EmptyStateBody>
      <Button
        onClick={() => {
          setWizardError(undefined);
          jumpToStep(0);
        }}
        variant="primary"
      >
        Return to Step 1
      </Button>
    </EmptyState>
  );
};

export default AddRoleError;
