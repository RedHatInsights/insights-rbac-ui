import React, { useState } from 'react';
import { Radio } from '@patternfly/react-core';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const TypeSelector = (props) => {
  const intl = useIntl();
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const [checked, setChecked] = useState(formOptions.getState().values['role-type']);
  const handleChange = (val) => {
    setChecked(val);
    input.onChange(val);
    formOptions.change('add-permissions-table', []);
    formOptions.change('base-permissions-loaded', false);
    formOptions.change('not-allowed-permissions', []);
  };

  return (
    <div>
      <Radio
        isChecked={checked === 'create'}
        className="pf-v5-u-mb-sm"
        name="role-type-create"
        onChange={() => handleChange('create')}
        label={intl.formatMessage(messages.createRoleFromScratch)}
        id="role-type-create"
        value="create"
      />
      <Radio
        isChecked={checked === 'copy'}
        name="role-type-copy"
        onChange={() => handleChange('copy')}
        label={intl.formatMessage(messages.copyAnExistingRole)}
        id="role-type-copy"
        value="copy"
      />
    </div>
  );
};

export default TypeSelector;
