import React, { useState } from 'react';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import { useIntl } from 'react-intl';
import { schemaBuilder, wizardMapper } from './schema';
import { requiredCheckboxValidator } from './validators';

const FormTemplate = (props: React.ComponentProps<typeof Pf4FormTemplate>) => <Pf4FormTemplate {...props} showFormControls={false} />;

export interface ConversionWizardProps {
  /** Callback when wizard is cancelled */
  onCancel: () => void;
  /** Callback when wizard is successfully completed */
  onSuccess?: () => void;
}

export const ConversionWizard: React.FC<ConversionWizardProps> = ({ onCancel, onSuccess }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const intl = useIntl();

  const schema = schemaBuilder(intl);

  const validatorMapper = {
    'required-checkbox': requiredCheckboxValidator(intl),
  };

  const onSubmit = async () => {
    // No-op for now - just show success state
    setShowSuccess(true);

    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    }
  };

  if (showSuccess) {
    // TODO: Replace with proper success state component
    return null;
  }

  return (
    <FormRenderer
      schema={schema}
      FormTemplate={FormTemplate}
      componentMapper={wizardMapper}
      validatorMapper={validatorMapper}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
};
