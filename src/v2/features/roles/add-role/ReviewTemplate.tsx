import React, { useContext, useEffect } from 'react';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Bullseye } from '@patternfly/react-core/dist/dynamic/layouts/Bullseye';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { asyncValidator } from './validators';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { WizardError } from '../../../../shared/components/ui-states/WizardError';
import { useIntl } from 'react-intl';

import { AddRoleWizardContext } from './AddRoleWizardContext';
import { commonMessages } from '../../../../shared/messages/common';

interface ReviewTemplateProps {
  formFields: React.ReactNode[][];
}

const ReviewTemplate: React.FC<ReviewTemplateProps> = ({ formFields }) => {
  const intl = useIntl();
  const { submitting, error, setWizardError } = useContext(AddRoleWizardContext);
  const { getState } = useFormApi();
  useEffect(() => {
    setWizardError?.(undefined);
    const roleType = getState().values['role-type'];
    const roleName = roleType === 'create' ? getState().values['role-name'] : getState().values['role-copy-name'];
    asyncValidator(roleName as string)
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
        title={intl.formatMessage({
          id: 'roleNameTakenTitle',
          defaultMessage: 'Role name already taken',
          description: 'Role name taken error title',
        })}
        text={intl.formatMessage({
          id: 'roleNameTakenText',
          defaultMessage: 'Please return to Step 1: Create role and choose a unique role name for your custom role.',
          description: 'Role name taken error text',
        })}
      />
    );
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h1" size="xl">
          {intl.formatMessage(commonMessages.reviewDetails)}
        </Title>
      </StackItem>
      <StackItem>
        <p>
          {intl.formatMessage({
            id: 'reviewRoleDetails',
            defaultMessage: 'Review and confirm the details for your role, or click Back to revise.',
            description: 'Review role details text',
          })}
        </p>
      </StackItem>
      <StackItem isFilled>{formFields?.[0]?.[0]}</StackItem>
    </Stack>
  );
};

export default ReviewTemplate;
