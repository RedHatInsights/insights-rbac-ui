import React from 'react';
import PropTypes from 'prop-types';
import { ActionGroup, Button } from '@patternfly/react-core';
import { isEmpty } from 'lodash';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import FormSpy from '@data-driven-forms/react-form-renderer/form-spy';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

const FormButtons = ({ dirtyFieldsSinceLastSubmit, submitSucceeded, pristine }) => {
  const { onCancel } = useFormApi();
  const noChanges = isEmpty(dirtyFieldsSinceLastSubmit) || (!submitSucceeded && pristine);
  const intl = useIntl();
  return (
    <ActionGroup className="pf-v5-u-mt-0">
      <Button ouiaId="primary-submit-button" type="submit" isDisabled={noChanges} variant="primary">
        {intl.formatMessage(messages.save)}
      </Button>
      <Button ouiaId="secondary-cancel-button" variant="link" onClick={() => onCancel()}>
        {intl.formatMessage(messages.cancel)}
      </Button>
    </ActionGroup>
  );
};

FormButtons.propTypes = {
  dirtyFieldsSinceLastSubmit: PropTypes.shape({
    [PropTypes.string]: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  }),
  submitSucceeded: PropTypes.bool,
  pristine: PropTypes.bool,
  onCancel: PropTypes.func,
};

const FormButtonWithSpies = (formProps) => (
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
