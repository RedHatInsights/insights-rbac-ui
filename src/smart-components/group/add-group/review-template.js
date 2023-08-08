import React, { useContext, useEffect } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import { AddGroupWizardContext } from './add-group-wizard';
import { asyncValidator } from '../validators';
import WizardError from '../../common/wizard-error';
import messages from '../../../Messages';

const ReviewTemplate = ({ formFields }) => {
  const intl = useIntl();
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
        <Spinner className="pf-u-mt-xl" size="xl" />
      </Bullseye>
    );
  }

  return error === true ? (
    <WizardError
      context={AddGroupWizardContext}
      title={intl.formatMessage(messages.groupNameTakenTitle)}
      text={intl.formatMessage(messages.groupNameTakenText)}
    />
  ) : (
    <React.Fragment>
      <Title headingLevel="h1" size="xl" className="pf-u-mb-lg">
        {intl.formatMessage(messages.reviewDetails)}
      </Title>
      {[[{ ...formFields?.[0]?.[0] }]]}
    </React.Fragment>
  );
};

ReviewTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default ReviewTemplate;
