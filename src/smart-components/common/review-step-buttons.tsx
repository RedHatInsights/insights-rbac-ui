import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Button } from '@patternfly/react-core';
import React, { Fragment, ReactNode, useContext } from 'react';

type NextStepFunction = (args: { values: Record<string, unknown> }) => string;

interface NextStepObject {
  when: string;
  stepMapper: Record<string, string>;
}

type NextStepType = string | NextStepFunction | NextStepObject;

interface ButtonLabels {
  submit: ReactNode;
  cancel: ReactNode;
  back: ReactNode;
  next: ReactNode;
}

interface ReviewStepButtonsProps {
  disableBack?: boolean;
  handlePrev: () => void;
  handleNext: (step: string) => void;
  nextStep?: NextStepType;
  buttonLabels: ButtonLabels;
  context: React.Context<{
    success?: boolean;
    error?: unknown;
    submitting?: boolean;
  }>;
  renderNextButton: () => React.ReactElement;
}

const ReviewStepButtons: React.FC<ReviewStepButtonsProps> = ({
  renderNextButton,
  disableBack,
  handlePrev,
  buttonLabels: { cancel, back },
  context,
}) => {
  const formOptions = useFormApi();
  const { success, error, submitting } = useContext(context);

  if (success || typeof error === 'undefined' || error || submitting) {
    return null;
  }

  return (
    <Fragment>
      {renderNextButton()}
      <Button type="button" variant="secondary" isDisabled={disableBack} onClick={handlePrev}>
        {back}
      </Button>
      <Button type="button" variant="link" onClick={formOptions.onCancel}>
        {cancel}
      </Button>
    </Fragment>
  );
};

export default ReviewStepButtons;
