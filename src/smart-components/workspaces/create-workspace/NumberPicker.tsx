import React from 'react';
import useFieldApi, { UseFieldApiConfig } from '@data-driven-forms/react-form-renderer/use-field-api';
import { NumberInput, NumberInputProps } from '@patternfly/react-core';

export interface NumberPickerProps extends Omit<NumberInputProps, 'name'>, UseFieldApiConfig {}

const NumberPicker: React.FC<NumberPickerProps> = (props: NumberPickerProps) => {
  const {
    title,
    disabled,
    input: { onChange, checked, ...input },
  } = useFieldApi({
    name: props.name,
    type: 'number',
  });

  return (
    <NumberInput
      {...input}
      value={input.value ?? 300}
      isDisabled={disabled}
      title={title}
      onMinus={() => null}
      onChange={onChange}
      onPlus={() => null}
      inputName={props.name}
      inputAriaLabel="number input"
      minusBtnAriaLabel="minus"
      plusBtnAriaLabel="plus"
    />
  );
};

export default NumberPicker;
