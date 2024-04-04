import React, { useContext } from 'react';
import { Button, ButtonVariant } from '@patternfly/react-core';
import WizardContext from '@data-driven-forms/react-form-renderer/wizard-context';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import messages from '../../Messages';
import { ErrorState } from '@patternfly/react-component-groups';

const WizardError = ({ context, title, text, customFooter }) => {
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

WizardError.propTypes = {
  context: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  customFooter: PropTypes.element,
};

export default WizardError;
