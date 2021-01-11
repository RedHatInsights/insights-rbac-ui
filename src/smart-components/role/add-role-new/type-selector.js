import React, { useState } from 'react';
import { Radio } from '@patternfly/react-core';
import useFieldApi from '@data-driven-forms/react-form-renderer/dist/esm/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/esm/use-form-api';

const TypeSelector = (props) => {
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const [checked, setChecked] = useState(formOptions.getState().values['role-type']);
  const handleChange = (val) => {
    setChecked(val);
    input.onChange(val);
    formOptions.change('add-permissions-table', []);
    formOptions.change('base-permissions-loaded', false);
  };

  return (
    <div>
      <Radio
        isChecked={checked === 'create'}
        name="role-type-create"
        onChange={() => handleChange('create')}
        label="Create a role from scratch"
        id="role-type-create"
        value="create"
      />
      <Radio
        isChecked={checked === 'copy'}
        name="role-type-copy"
        onChange={() => handleChange('copy')}
        label="Copy an existing role"
        id="role-type-copy"
        value="copy"
      />
    </div>
  );
};

export default TypeSelector;
