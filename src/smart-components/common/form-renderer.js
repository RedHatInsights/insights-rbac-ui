import React from 'react';
import Pf4SelectWrapper from '../../presentational-components/shared/pf4-select-wrapper';
import FormButtons from './FormButtons';
import FormTemplate from '@data-driven-forms/pf4-component-mapper/dist/cjs/form-template';
import TextField from '@data-driven-forms/pf4-component-mapper/dist/cjs/text-field';
import Textarea from '@data-driven-forms/pf4-component-mapper/dist/cjs/textarea';
import ReactFormRender from '@data-driven-forms/react-form-renderer/dist/cjs/form-renderer';
import componentTypes from '@data-driven-forms/react-form-renderer/dist/cjs/component-types';

const FormRenderer = (props) => (
    <ReactFormRender
      componentMapper={ {
        [componentTypes.TEXT_FIELD]: TextField,
        [componentTypes.TEXTAREA]: Textarea,
        [componentTypes.SELECT]: Pf4SelectWrapper
      } }
      FormTemplate={ (props) => <FormTemplate { ...props } FormButtons={ FormButtons } /> }
      { ...props }
    />
);

export default FormRenderer;
