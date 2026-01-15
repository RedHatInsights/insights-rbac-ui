import React from 'react';
import { ActionGroup } from '@patternfly/react-core';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { isEmpty } from 'lodash';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import FormSpy from '@data-driven-forms/react-form-renderer/form-spy';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

interface FormButtonsProps {
  dirtyFieldsSinceLastSubmit?: Record<string, string | number | boolean>;
  submitSucceeded?: boolean;
  pristine?: boolean;
  onCancel?: () => void;
}

const FormButtons: React.FC<FormButtonsProps> = ({ dirtyFieldsSinceLastSubmit, submitSucceeded, pristine }) => {
  const { onCancel } = useFormApi();
  const noChanges = isEmpty(dirtyFieldsSinceLastSubmit) || (!submitSucceeded && pristine);
  const intl = useIntl();

  return (
    <ActionGroup className="pf-v6-u-mt-0">
      <Button ouiaId="primary-submit-button" type="submit" isDisabled={noChanges} variant="primary">
        {intl.formatMessage(messages.save)}
      </Button>
      <Button ouiaId="secondary-cancel-button" variant="link" onClick={(e) => onCancel?.(e)}>
        {intl.formatMessage(messages.cancel)}
      </Button>
    </ActionGroup>
  );
};

interface FormButtonWithSpiesProps {
  onCancel?: () => void;
}

const FormButtonWithSpies: React.FC<FormButtonWithSpiesProps> = (formProps) => (
  <FormSpy
    subscription={{
      pristine: true,
      submitSucceeded: true,
      dirtyFieldsSinceLastSubmit: true,
    }}
  >
    {(props) => <FormButtons {...props} {...formProps} />}
  </FormSpy>
);

export default FormButtonWithSpies;
