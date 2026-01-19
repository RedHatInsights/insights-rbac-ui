import React from 'react';
import FormButtons from './FormButtons';
import FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import TextField from '@data-driven-forms/pf4-component-mapper/text-field';
import Textarea from '@data-driven-forms/pf4-component-mapper/textarea';
import ReactFormRender from '@data-driven-forms/react-form-renderer/form-renderer';
import type { FormRendererProps as DdfFormRendererProps } from '@data-driven-forms/react-form-renderer/form-renderer';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';

interface FormRendererProps extends Omit<DdfFormRendererProps, 'componentMapper' | 'FormTemplate'> {
  formTemplateProps?: Record<string, unknown>;
}

const FormRenderer: React.FC<FormRendererProps> = ({ formTemplateProps, ...props }) => (
  <ReactFormRender
    componentMapper={{
      [componentTypes.TEXT_FIELD]: TextField,
      [componentTypes.TEXTAREA]: Textarea,
    }}
    FormTemplate={(templateProps) => <FormTemplate {...formTemplateProps} {...templateProps} FormButtons={FormButtons} />}
    {...props}
  />
);

export default FormRenderer;
