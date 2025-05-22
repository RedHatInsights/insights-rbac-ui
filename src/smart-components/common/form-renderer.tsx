import FormTemplateCommonProps from '@data-driven-forms/common/form-template';
import FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import TextField from '@data-driven-forms/pf4-component-mapper/text-field';
import Textarea from '@data-driven-forms/pf4-component-mapper/textarea';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import ReactFormRender from '@data-driven-forms/react-form-renderer/form-renderer';
import { FormRendererProps } from '@data-driven-forms/react-form-renderer/form-renderer/form-renderer';
import React from 'react';
import FormButtons from './FormButtons';

interface FormRendererCustomProps {
  formTemplateProps?: FormTemplateCommonProps;
}

const FormRenderer = <T extends Record<string, any> = Record<string, any>>({
  formTemplateProps,
  ...props
}: FormRendererCustomProps & Omit<FormRendererProps<T>, 'componentMapper'> & Partial<Pick<FormRendererProps<T>, 'componentMapper'>>) => (
  <ReactFormRender<T>
    componentMapper={{
      [componentTypes.TEXT_FIELD]: TextField,
      [componentTypes.TEXTAREA]: Textarea,
    }}
    FormTemplate={(props) => <FormTemplate {...formTemplateProps} {...props} FormButtons={FormButtons} />}
    {...props}
  />
);

export default FormRenderer;
