import React from 'react';
import PropTypes from 'prop-types';

import FormSpy from '@data-driven-forms/react-form-renderer/dist/cjs/form-spy';
import FormTemplate from '@data-driven-forms/pf4-component-mapper/dist/cjs/form-template';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-form-api';

import { Modal } from '@patternfly/react-core/dist/js/components/Modal';
import { ActionGroup } from '@patternfly/react-core/dist/js/components/Form/ActionGroup';
import { Button } from '@patternfly/react-core/dist/js/components/Button';
import { Form } from '@patternfly/react-core/dist/js/components/Form/Form';

/**
 * This id is requried to submit form by a byttoun outside of the form element
 */
const MODAL_FORM_IDENTIFIER = 'modal-form';
const CustomFormWrapper = (props) => <Form {...props} id={MODAL_FORM_IDENTIFIER} />;

const CustomButtons = ({ saveLabel, cancelLabel }) => {
  const { onCancel } = useFormApi();

  return (
    <FormSpy>
      {({ pristine, invalid, validating, submitting }) => (
        <div className="pf-c-form">
          <ActionGroup className="pf-u-mt-0">
            <Button variant="primary" form={MODAL_FORM_IDENTIFIER} type="submit" isDisabled={pristine || validating || submitting || invalid}>
              {saveLabel}
            </Button>
            <Button variant="link" onClick={onCancel} id="cancel-modal">
              {cancelLabel}
            </Button>
          </ActionGroup>
        </div>
      )}
    </FormSpy>
  );
};

CustomButtons.propTypes = {
  saveLabel: PropTypes.node,
  cancelLabel: PropTypes.node,
};

CustomButtons.defaultProps = {
  saveLabel: 'Save',
  cancelLabel: 'Cancel',
};

const ModalFormTemplate = ({ ModalProps, saveLabel, cancelLabel, ...props }) => (
  <Modal {...ModalProps} footer={<CustomButtons saveLabel={saveLabel} cancelLabel={cancelLabel} />}>
    <FormTemplate {...props} showFormControls={false} FormWrapper={CustomFormWrapper} />
  </Modal>
);

ModalFormTemplate.propTypes = {
  ModalProps: PropTypes.object,
  ...CustomButtons.propTypes,
};

export default ModalFormTemplate;
