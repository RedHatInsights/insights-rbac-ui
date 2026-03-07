import React, { useContext } from 'react';
import { ActionList, ActionListGroup, ActionListItem } from '@patternfly/react-core';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';

interface WizardButtonLabels {
  submit: React.ReactNode;
  cancel: React.ReactNode;
  back: React.ReactNode;
  next: React.ReactNode;
}

interface WizardContextValue {
  success?: boolean;
  error?: string | boolean;
  submitting?: boolean;
}

interface ReviewStepButtonsProps {
  disableBack?: boolean;
  handlePrev: () => void;
  buttonLabels: WizardButtonLabels;
  renderNextButton: () => React.ReactNode;
  context: React.Context<WizardContextValue>;
}

/**
 * ReviewStepButtons - Custom wizard footer buttons for review/submit steps
 *
 * Uses ActionList/ActionListGroup for proper PF6 button layout.
 * Hides buttons during submission or after success/error states.
 */
const ReviewStepButtons: React.FC<ReviewStepButtonsProps> = ({
  renderNextButton,
  disableBack,
  handlePrev,
  buttonLabels: { cancel, back },
  context,
}) => {
  const formOptions = useFormApi();
  const { success, error, submitting } = useContext(context);

  // Hide buttons during submission or after completion
  if (success || typeof error === 'undefined' || error || submitting) {
    return null;
  }

  return (
    <ActionList>
      <ActionListGroup>
        <ActionListItem>{renderNextButton()}</ActionListItem>
        <ActionListItem>
          <Button type="button" variant="secondary" isDisabled={disableBack} onClick={handlePrev}>
            {back}
          </Button>
        </ActionListItem>
      </ActionListGroup>
      <ActionListGroup>
        <ActionListItem>
          <Button type="button" variant="link" onClick={formOptions.onCancel}>
            {cancel}
          </Button>
        </ActionListItem>
      </ActionListGroup>
    </ActionList>
  );
};

export default ReviewStepButtons;
