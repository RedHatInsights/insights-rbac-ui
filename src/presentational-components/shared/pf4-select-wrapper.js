import React from 'react';
import PropTypes from 'prop-types';
import { FormSelect, FormSelectOption, FormGroup, TextContent, Text, TextVariants } from '@patternfly/react-core';

const createOptions = (options, inputValue, isRequired) => {
  if (inputValue && isRequired) {
    return options;
  }

  let selectOptions = [ ...options ];
  return selectOptions.find(({ value }) => value === undefined)
    ? [ ...selectOptions ]
    : [{ label: isRequired ? 'Please choose' : 'None' }, ...selectOptions ];
};

const Select = ({
  input,
  options,
  isReadOnly,
  isDisabled,
  FieldProvider,
  isRequired,
  ...rest
}) => (
  <FormSelect { ...input } { ...rest } isDisabled={ isDisabled || isReadOnly }>
    { createOptions(options, input.value, isRequired).map((props) => (
      <FormSelectOption key={ props.value || props.label } { ...props } label={ props.label.toString() }/> // eslint-disable-line react/prop-types
    )) }
  </FormSelect>
);

Select.propTypes = {
  input: PropTypes.object.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.any,
    label: PropTypes.string.isRequired
  })).isRequired,
  isReadOnly: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isRequired: PropTypes.bool,
  FieldProvider: PropTypes.any
};

const Pf4SelectWrapper = ({
  componentType,
  label,
  isRequired,
  helperText,
  meta,
  description,
  hideLabel,
  ...rest
}) => {
  const { error, touched } = meta;
  const showError = touched && error;

  return (
    <FormGroup
      isRequired={ isRequired }
      label={ !hideLabel && label }
      fieldId={ rest.id }
      isValid={ !showError }
      helperText={ helperText }
      helperTextInvalid={ meta.error }
    >
      { description && <TextContent><Text component={ TextVariants.small }>{ description }</Text></TextContent> }
      <Select label={ label } isValid={ !showError } isRequired={ isRequired } { ...rest }/>
    </FormGroup>
  );
};

Pf4SelectWrapper.propTypes = {
  componentType: PropTypes.string,
  label: PropTypes.string,
  isRequired: PropTypes.bool,
  helperText: PropTypes.string,
  meta: PropTypes.object,
  description: PropTypes.string,
  hideLabel: PropTypes.bool
};

export default Pf4SelectWrapper;
