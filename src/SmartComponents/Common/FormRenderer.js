import React from 'react';
import PropTypes from 'prop-types';
import ReactFormRender, { componentTypes } from '@data-driven-forms/react-form-renderer';
import { layoutMapper, formFieldsMapper } from '@data-driven-forms/pf4-component-mapper';
import Pf4SelectWrapper from '../../PresentationalComponents/Shared/pf4-select-wrapper';

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
        componentMapper,
        [componentTypes.SELECT]: Pf4SelectWrapper
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
