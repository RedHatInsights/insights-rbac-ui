import React from 'react';
import PropTypes from 'prop-types';
import Pf4SelectWrapper from '../../presentational-components/shared/pf4-select-wrapper';
import FormButtons from './FormButtons';
import FormTemplate from '@data-driven-forms/pf4-component-mapper/dist/esm/form-template';
import TextField from '@data-driven-forms/pf4-component-mapper/dist/esm/text-field';
import Textarea from '@data-driven-forms/pf4-component-mapper/dist/esm/textarea';
import ReactFormRender from '@data-driven-forms/react-form-renderer/dist/esm/form-renderer';
import componentTypes from '@data-driven-forms/react-form-renderer/dist/esm/component-types';

const FormRenderer = ({ formTemplateProps, ...props }) => (
  <ReactFormRender
    componentMapper={{
      [componentTypes.TEXT_FIELD]: TextField,
      [componentTypes.TEXTAREA]: Textarea,
      [componentTypes.SELECT]: Pf4SelectWrapper,
    }}
    FormTemplate={(props) => <FormTemplate {...formTemplateProps} {...props} FormButtons={FormButtons} />}
    {...props}
  />
);

FormRenderer.propTypes = {
  formTemplateProps: PropTypes.object,
};

export default FormRenderer;
