import React from 'react';
import { useIntl } from 'react-intl';
import FormSpy from '@data-driven-forms/react-form-renderer/form-spy';
import FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Modal } from '@patternfly/react-core/dist/js/components/Modal';
import { ActionGroup } from '@patternfly/react-core/dist/js/components/Form/ActionGroup';
import { Button } from '@patternfly/react-core/dist/js/components/Button';
import { Form } from '@patternfly/react-core/dist/js/components/Form/Form';
import messages from '../../Messages';

/**
 * This id is required to submit form by a button outside of the form element
 */
const MODAL_FORM_IDENTIFIER = 'modal-form';

interface CustomFormWrapperProps {
  children?: React.ReactNode;
  onSubmit?: (event: React.FormEvent) => void;
}

const CustomFormWrapper: React.FC<CustomFormWrapperProps> = (props) => <Form {...props} id={MODAL_FORM_IDENTIFIER} />;

interface CustomButtonsProps {
  saveLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
}

const CustomButtons: React.FC<CustomButtonsProps> = ({ saveLabel, cancelLabel }) => {
  const intl = useIntl();
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
              {saveLabel || intl.formatMessage(messages.save)}
            </Button>
            <Button ouiaId="secondary-cancel-button" variant="link" onClick={onCancel} id="cancel-modal">
              {cancelLabel || intl.formatMessage(messages.cancel)}
            </Button>
          </ActionGroup>
        </div>
      )}
    </FormSpy>
  );
};

interface ModalFormTemplateProps {
  ModalProps?: {
    onClose?: () => void;
    isOpen?: boolean;
    variant?: 'small' | 'medium' | 'large' | 'default';
    title?: string;
    [key: string]: any;
  };
  saveLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  alert?: () => React.ReactNode;
  formFields?: any;
  schema?: any;
  [key: string]: any;
}

export const ModalFormTemplate: React.FC<ModalFormTemplateProps> = ({ ModalProps, saveLabel, cancelLabel, alert, ...props }) => (
  <Modal role="dialog" {...ModalProps} footer={<CustomButtons saveLabel={saveLabel} cancelLabel={cancelLabel} />}>
    {alert?.()}
    <FormTemplate {...(props as any)} showFormControls={false} FormWrapper={CustomFormWrapper} />
  </Modal>
);
