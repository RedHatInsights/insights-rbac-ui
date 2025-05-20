import FormTemplateCommonProps from '@data-driven-forms/common/form-template';
import FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';

import FormSpy from '@data-driven-forms/react-form-renderer/form-spy';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ActionGroup, Form, FormProps } from '@patternfly/react-core/dist/dynamic/components/Form';

import { Modal, ModalProps } from '@patternfly/react-core/dist/dynamic/components/Modal';
import React from 'react';

/**
 * This id is requried to submit form by a button outside of the form element
 */
const MODAL_FORM_IDENTIFIER = 'modal-form';
const CustomFormWrapper: React.FC<FormProps> = (props) => <Form {...props} id={MODAL_FORM_IDENTIFIER} />;

type CustomButtonsProps = {
  saveLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
};
const CustomButtons: React.FC<CustomButtonsProps> = ({ saveLabel = 'Save', cancelLabel = 'Cancel' }) => {
  const { onCancel } = useFormApi();

  return (
    <FormSpy>
      {({ pristine, invalid, validating, submitting }) => (
        <div className="pf-v5-c-form">
          <ActionGroup className="pf-v5-u-mt-0">
            <Button
              ouiaId="primary-save-button"
              variant="primary"
              form={MODAL_FORM_IDENTIFIER}
              type="submit"
              isDisabled={pristine || validating || submitting || invalid}
            >
              {saveLabel}
            </Button>
            <Button ouiaId="secondary-cancel-button" variant="link" onClick={onCancel} id="cancel-modal">
              {cancelLabel}
            </Button>
          </ActionGroup>
        </div>
      )}
    </FormSpy>
  );
};

type ModalFormTemplateProps = {
  ModalProps: Omit<ModalProps, 'ref' | 'children'>;
} & CustomButtonsProps &
  FormTemplateCommonProps;

const ModalFormTemplate: React.FC<ModalFormTemplateProps> = ({ ModalProps, saveLabel, cancelLabel, alert, ...props }) => (
  <Modal role="dialog" {...ModalProps} footer={<CustomButtons saveLabel={saveLabel} cancelLabel={cancelLabel} />}>
    {alert?.()}
    <FormTemplate {...props} showFormControls={false} FormWrapper={CustomFormWrapper} />
  </Modal>
);

export default ModalFormTemplate;
