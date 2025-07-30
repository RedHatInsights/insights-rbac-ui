import React from 'react';
import FormButtons from './FormButtons';
import FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import TextField from '@data-driven-forms/pf4-component-mapper/text-field';
import Textarea from '@data-driven-forms/pf4-component-mapper/textarea';
import ReactFormRender from '@data-driven-forms/react-form-renderer/form-renderer';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';

const FormRenderer: React.FC<any> = ({ formTemplateProps, ...props }) => (
  <ReactFormRender
    componentMapper={{
      [componentTypes.TEXT_FIELD]: TextField,
      [componentTypes.TEXTAREA]: Textarea,
    }}
    FormTemplate={(props) => <FormTemplate {...formTemplateProps} {...props} FormButtons={FormButtons} />}
    {...props}
  />
);

export default FormRenderer;
