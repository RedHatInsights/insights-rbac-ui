import React from 'react';
import ReactFormRender from '@data-driven-forms/react-form-renderer';
import PropTypes from 'prop-types';
import { layoutMapper, formFieldsMapper } from '@data-driven-forms/pf4-component-mapper';

const FormRenderer = ({ componentMapper, ...rest }) => (
  <ReactFormRender
    formFieldsMapper={ {
      ...formFieldsMapper,
      componentMapper
    } }
    layoutMapper={ layoutMapper }
    { ...rest }
  />
);

FormRenderer.propTypes = {
  componentMapper: PropTypes.object
};

FormRenderer.defaultProps = {
  componentMapper: {}
};

export default FormRenderer;
