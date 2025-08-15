import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Bullseye, Spinner, Text, TextContent, Title } from '@patternfly/react-core';
import { asyncValidator } from './validators';
import './review.scss';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import WizardError from '../../common/wizard-error';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import { AddRoleWizardContext } from './add-role-wizard-context';

const ReviewTemplate = ({ formFields }) => {
  const intl = useIntl();
  const { submitting, error, setWizardError } = useContext(AddRoleWizardContext);
  const { getState } = useFormApi();
  useEffect(() => {
    setWizardError(undefined);
    asyncValidator(getState().values['role-name'])
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
        context={AddRoleWizardContext}
        title={intl.formatMessage(messages.roleNameTakenTitle)}
        text={intl.formatMessage(messages.roleNameTakenText)}
      />
    );
  }

  return (
    <div className="rbac">
      <Title headingLevel="h1" size="xl" className="pf-v5-u-mb-sm">
        {intl.formatMessage(messages.reviewDetails)}
      </Title>
      <TextContent className="pf-v5-u-mb-md">
        <Text>{intl.formatMessage(messages.reviewRoleDetails)}</Text>
      </TextContent>
      {formFields?.[0]?.[0]}
    </div>
  );
};

ReviewTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default ReviewTemplate;
