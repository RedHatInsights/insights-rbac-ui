import React, { useContext } from 'react';
import { Title, Button, EmptyState, EmptyStateVariant, EmptyStateIcon, EmptyStateBody } from '@patternfly/react-core';
import WizardContext from '@data-driven-forms/react-form-renderer/wizard-context';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import PropTypes from 'prop-types';

const WizardError = ({ context, title, text }) => {
  const { jumpToStep } = useContext(WizardContext);
  const { setWizardError } = useContext(context);
  return (
    <EmptyState variant={EmptyStateVariant.large}>
      <EmptyStateIcon color="red" icon={ExclamationCircleIcon} />
      <Title headingLevel="h4" size="lg">
        {title}
      </Title>
      <EmptyStateBody>{text}</EmptyStateBody>
      <Button
        onClick={() => {
          setWizardError(undefined);
          jumpToStep(0);
        }}
        variant="primary"
      >
        Return to Step 1
      </Button>
    </EmptyState>
  );
};

WizardError.propTypes = {
  context: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

export default WizardError;
