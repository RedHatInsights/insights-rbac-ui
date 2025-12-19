import React, { useContext, useEffect } from 'react';
import { Bullseye } from '@patternfly/react-core';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { asyncValidator } from './validators';
import './review.scss';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { WizardError } from '../../../components/ui-states/WizardError';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import { AddRoleWizardContext } from './AddRoleWizardContext';

interface ReviewTemplateProps {
  formFields: React.ReactNode[][];
}

const ReviewTemplate: React.FC<ReviewTemplateProps> = ({ formFields }) => {
  const intl = useIntl();
  const { submitting, error, setWizardError } = useContext(AddRoleWizardContext);
  const { getState } = useFormApi();
  useEffect(() => {
    setWizardError?.(undefined);
    asyncValidator(getState().values['role-name'])
      .then(() => setWizardError?.(false))
      .catch(() => setWizardError?.(true));
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
        context={{ setWizardError: (e) => setWizardError?.(e as boolean | undefined) }}
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

export default ReviewTemplate;
