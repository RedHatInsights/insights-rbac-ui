import React, { useContext, useEffect } from 'react';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { asyncValidator } from './validators';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { WizardError } from '../../../../shared/components/ui-states/WizardError';
import { useIntl } from 'react-intl';
import messages from '../../../../Messages';
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
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h1" size="xl">
          {intl.formatMessage(messages.reviewDetails)}
        </Title>
      </StackItem>
      <StackItem>
        <p>{intl.formatMessage(messages.reviewRoleDetails)}</p>
      </StackItem>
      <StackItem isFilled>{formFields?.[0]?.[0]}</StackItem>
    </Stack>
  );
};

export default ReviewTemplate;
