import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import React, { Fragment, useContext } from 'react';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';

const selectNext = (nextStep, getState) =>
  ({
    string: nextStep,
    function: nextStep({ values: getState().values }),
  })?.[typeof nextStep] || nextStep.stepMapper?.[get(getState().values, nextStep.when)];

const NextButton = ({ nextStep, valid, handleNext, nextLabel, getState, handleSubmit, submitLabel }) => (
  <Button
    variant="primary"
    type="button"
    isDisabled={!valid || getState().validating}
    onClick={() => (nextStep ? handleNext(selectNext(nextStep, getState)) : handleSubmit())}
  >
    {nextStep ? nextLabel : submitLabel}
  </Button>
);

NextButton.propTypes = {
  nextStep: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
  handleSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.node.isRequired,
  valid: PropTypes.bool,
  handleNext: PropTypes.func.isRequired,
  nextLabel: PropTypes.node.isRequired,
  getState: PropTypes.func.isRequired,
};

const ReviewStepButtons = ({ renderNextButton, disableBack, handlePrev, buttonLabels: { cancel, back }, context }) => {
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

ReviewStepButtons.propTypes = {
  disableBack: PropTypes.bool,
  handlePrev: PropTypes.func.isRequired,
  handleNext: PropTypes.func.isRequired,
  nextStep: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      when: PropTypes.string.isRequired,
      stepMapper: PropTypes.object.isRequired,
    }),
    PropTypes.func,
  ]),
  buttonLabels: PropTypes.shape({
    submit: PropTypes.node.isRequired,
    cancel: PropTypes.node.isRequired,
    back: PropTypes.node.isRequired,
    next: PropTypes.node.isRequired,
  }).isRequired,
  context: PropTypes.object.isRequired,
  renderNextButton: PropTypes.func,
};

export default ReviewStepButtons;
