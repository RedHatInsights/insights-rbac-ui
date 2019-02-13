import React from 'react';
import ReactFormRender from '@data-driven-forms/react-form-renderer';
import PropTypes from 'prop-types';
import { layoutMapper, formFieldsMapper } from '@data-driven-forms/pf4-component-mapper';

const buttonPositioning = {
  default: {},
  modal: {
    buttonOrder: [ 'cancel', 'reset', 'save' ],
    buttonClassName: 'modal-form-right-align'
  }
};

const FormRenderer = ({ componentMapper, formContainer, ...rest }) => (
  <div className={ buttonPositioning[formContainer].buttonClassName }>
    <ReactFormRender
      formFieldsMapper={ {
        ...formFieldsMapper,
        componentMapper
      } }
      layoutMapper={ layoutMapper }
      { ...buttonPositioning[formContainer] }
      { ...rest }
    />
  </div>
);

FormRenderer.propTypes = {
  componentMapper: PropTypes.object,
  formContainer: PropTypes.oneOf('default', 'modal')
};

FormRenderer.defaultProps = {
  componentMapper: {},
  formContainer: 'default'
};

export default FormRenderer;
