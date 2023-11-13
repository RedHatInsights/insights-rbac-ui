import React, { useContext } from 'react';
import { Button, EmptyState, EmptyStateVariant, EmptyStateIcon, EmptyStateBody, EmptyStateHeader, EmptyStateFooter } from '@patternfly/react-core';
import WizardContext from '@data-driven-forms/react-form-renderer/wizard-context';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import messages from '../../Messages';

const WizardError = ({ context, title, text }) => {
  const intl = useIntl();
  const { jumpToStep } = useContext(WizardContext);
  const { setWizardError } = useContext(context);
  return (
    <EmptyState variant={EmptyStateVariant.lg}>
      <EmptyStateHeader titleText={<>{title}</>} icon={<EmptyStateIcon color="red" icon={ExclamationCircleIcon} />} headingLevel="h4" />
      <EmptyStateBody>{text}</EmptyStateBody>
      <EmptyStateFooter>
        <Button
          onClick={() => {
            setWizardError(undefined);
            jumpToStep(0);
          }}
          variant="primary"
        >
          {intl.formatMessage(messages.returnToStepNumber, { number: 1 })}
        </Button>
      </EmptyStateFooter>
    </EmptyState>
  );
};

WizardError.propTypes = {
  context: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

export default WizardError;
