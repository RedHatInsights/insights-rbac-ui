import React from 'react';
import PropTypes from 'prop-types';
import { ActionGroup, Button } from '@patternfly/react-core';
import { isEmpty } from 'lodash';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/esm/use-form-api';
import FormSpy from '@data-driven-forms/react-form-renderer/dist/esm/form-spy';

const FormButtons = ({ dirtyFieldsSinceLastSubmit, submitSucceeded, pristine }) => {
  const { onCancel } = useFormApi();
  const noChanges = isEmpty(dirtyFieldsSinceLastSubmit) || (!submitSucceeded && pristine);
  return (
    <ActionGroup className="pf-u-mt-0">
      <Button ouiaId="primary-submit-button" type="submit" isDisabled={noChanges} variant="primary">
        Save
      </Button>
      <Button ouiaId="secondary-cancel-button" variant="link" onClick={() => onCancel()}>
        Cancel
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
