import FormSpy from '@data-driven-forms/react-form-renderer/form-spy';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { ActionGroup, Button } from '@patternfly/react-core';
import { isEmpty } from 'lodash';
import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

type FormButtonsProp = {
  dirtyFieldsSinceLastSubmit: {
    [field: string]: string | number | boolean;
  };
  submitSucceeded: boolean;
  pristine: boolean;
  onCancel: () => void;
};

const FormButtons: React.FC<FormButtonsProp> = ({ dirtyFieldsSinceLastSubmit, submitSucceeded, pristine }) => {
  const { onCancel } = useFormApi();
  const noChanges = isEmpty(dirtyFieldsSinceLastSubmit) || (!submitSucceeded && pristine);
  const intl = useIntl();
  return (
    <ActionGroup className="pf-v5-u-mt-0">
      <Button ouiaId="primary-submit-button" type="submit" isDisabled={noChanges} variant="primary">
        {intl.formatMessage(messages.save)}
      </Button>
      <Button ouiaId="secondary-cancel-button" variant="link" onClick={() => (onCancel ? onCancel({}) : undefined)}>
        {intl.formatMessage(messages.cancel)}
      </Button>
    </ActionGroup>
  );
};

const FormButtonsWithSpies: React.FC<FormButtonsProp> = (formProps) => (
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

export default FormButtonsWithSpies;
