import React from 'react';
import PropTypes from 'prop-types';
import ReactFormRender, { componentTypes } from '@data-driven-forms/react-form-renderer';
import Pf4SelectWrapper from '../../presentational-components/shared/pf4-select-wrapper';
import { componentMapper, FormTemplate } from '@data-driven-forms/pf4-component-mapper';
import FormButtons from './FormButtons';

const FormRenderer = ({ schema, onCancel, onSubmit, initialValues }) => {
  return (
    <ReactFormRender
      componentMapper={ {
        ...componentMapper,
        [componentTypes.SELECT]: Pf4SelectWrapper
      } }
      FormTemplate={ (props) => <FormTemplate { ...props } FormButtons={ FormButtons }></FormTemplate> }
      initialValues={ initialValues }
      onSubmit={ onSubmit }
      onCancel={ onCancel }
      schema={ schema }
    />
  );
};

FormRenderer.propTypes = {
  componentMapper: PropTypes.object,
  schema: PropTypes.object,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  initialValues: PropTypes.object
};

FormRenderer.defaultProps = {
  schema: {},
  onSubmit: null,
  onCancel: null,
  initialValues: {}
};

export default FormRenderer;
