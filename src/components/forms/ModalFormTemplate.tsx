import React from 'react';
import { useIntl } from 'react-intl';
import FormSpy from '@data-driven-forms/react-form-renderer/form-spy';
import FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Modal } from '@patternfly/react-core/dist/js/deprecated/components/Modal';
import { ActionGroup } from '@patternfly/react-core/dist/js/components/Form/ActionGroup';
import { Button } from '@patternfly/react-core/dist/js/components/Button';
import { Form } from '@patternfly/react-core/dist/js/components/Form/Form';
import messages from '../../Messages';
import { getModalContainer } from '../../helpers/modal-container';

/**
 * This id is required to submit form by a button outside of the form element
 */
const MODAL_FORM_IDENTIFIER = 'modal-form';

// FormWrapper component for FormTemplate - must be a plain function for PropTypes validation
// Using function declaration (not arrow function) to ensure PropTypes.func validation passes
function CustomFormWrapper(props: React.ComponentProps<typeof Form>) {
  return <Form {...props} id={MODAL_FORM_IDENTIFIER} />;
}

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
        <div className="pf-v6-c-form">
          <ActionGroup className="pf-v6-u-mt-0">
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
    [key: string]: unknown;
  };
  saveLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  alert?: () => React.ReactNode;
  formFields?: React.ElementType[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema?: any;
  [key: string]: unknown;
}

export const ModalFormTemplate: React.FC<ModalFormTemplateProps> = ({ ModalProps, saveLabel, cancelLabel, alert, ...props }) => {
  // Extract formFields and schema
  const { formFields = [], schema = { fields: [] }, ...otherProps } = props;

  return (
    <Modal {...ModalProps} appendTo={getModalContainer()} footer={<CustomButtons saveLabel={saveLabel} cancelLabel={cancelLabel} />}>
      {alert?.()}
      <FormTemplate formFields={formFields} schema={schema} {...otherProps} showFormControls={false} FormWrapper={CustomFormWrapper} />
    </Modal>
  );
};
