import React, { ReactElement, useContext } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ButtonVariant } from '@patternfly/react-core';
import WizardContext from '@data-driven-forms/react-form-renderer/wizard-context';
import { useIntl } from 'react-intl';
import { ErrorState } from '@patternfly/react-component-groups';
import messages from '../../Messages';

interface WizardErrorProps {
  context: {
    setWizardError: (error: undefined) => void;
  };
  title: string;
  text: string;
  customFooter?: ReactElement;
}

export const WizardError: React.FC<WizardErrorProps> = ({ context, title, text, customFooter }) => {
  const intl = useIntl();
  const { jumpToStep } = useContext(WizardContext);
  const { setWizardError } = context;

  return (
    <ErrorState
      titleText={title}
      bodyText={text}
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
