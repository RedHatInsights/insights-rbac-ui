import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import { AddGroupWizardContext } from './add-group-wizard';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/esm/use-form-api';
import { asyncValidator } from '../validators';
import WizardError from '../../common/wizard-error';

const ReviewTemplate = ({ formFields }) => {
  const { submitting, error, setWizardError } = useContext(AddGroupWizardContext);
  const { getState } = useFormApi();
  useEffect(() => {
    setWizardError(undefined);
    asyncValidator(getState().values['group-name'])
      .then(() => setWizardError(false))
      .catch(() => setWizardError(true));
  }, []);

  if (typeof error === 'undefined' || submitting) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  if (error === true) {
    return (
      <WizardError
        context={AddGroupWizardContext}
        title="Group name already taken"
        text="Please return to Step 1: Group information and choose a unique group name for your group."
      />
    );
  }

  return (
    <React.Fragment>
      <Title headingLevel="h1" size="xl" className="pf-u-mb-lg">
        Review details
      </Title>
      {[[{ ...formFields?.[0]?.[0] }]]}
    </React.Fragment>
  );
};

ReviewTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default ReviewTemplate;
