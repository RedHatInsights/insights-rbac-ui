import WizardContext from '@data-driven-forms/react-form-renderer/wizard-context';
import { ErrorState } from '@patternfly/react-component-groups';
import { Button, ButtonVariant } from '@patternfly/react-core';
import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

interface WizardErrorProps {
  context: React.Context<{
    setWizardError: (error: unknown) => void;
  }>;
  title: string;
  text: string;
  customFooter?: React.ReactElement;
}

const WizardError: React.FC<WizardErrorProps> = ({ context, title, text, customFooter }) => {
  const intl = useIntl();
  const { jumpToStep } = useContext(WizardContext);
  const { setWizardError } = useContext(context);

  return (
    <ErrorState
      errorTitle={title}
      errorDescription={text}
      customFooter={
        customFooter || (
          <Button
            onClick={() => {
              setWizardError(undefined);
              jumpToStep(0);
            }}
            variant={ButtonVariant.primary}
          >
            {intl.formatMessage(messages.returnToStepNumber, { number: 1 })}
          </Button>
        )
      }
    />
  );
};

export default WizardError;
