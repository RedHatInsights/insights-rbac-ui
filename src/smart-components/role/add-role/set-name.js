import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Stack, StackItem } from '@patternfly/react-core';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { TextInput } from '@patternfly/react-core/dist/esm/components/TextInput/TextInput';
import { TextArea } from '@patternfly/react-core/dist/esm/components/TextArea/TextArea';
import { FormGroup } from '@patternfly/react-core/dist/esm/components/Form/FormGroup';
import { debouncedAsyncValidator } from './validators';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const roleNameValidated = (roleName, roleNameError) => (roleName === undefined || roleNameError || roleName?.length > 150 ? 'error' : 'default');
const roleDescriptionValidated = (roleDescription) => (roleDescription?.length > 150 ? 'error' : 'default');

const SetName = (props) => {
  const intl = useIntl();
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const { 'role-name': name, 'role-description': description } = formOptions.getState().values;
  const [roleName, setRoleName] = useState(name || '');
  const [roleNameError, setRoleNameError] = useState();
  const [roleDescription, setRoleDescription] = useState(description);

  const processRoleName = (value) => {
    input.onChange(undefined);
    debouncedAsyncValidator(value)
      .then(() => {
        input.onChange(value);
        setRoleNameError(undefined);
      })
      .catch((error) => {
        setRoleNameError(error);
        input.onChange(undefined);
      });
    setRoleName(value);
  };

  useEffect(() => {
    roleName?.length > 0 && processRoleName(roleName);
  }, []);

  return (
    <Stack hasGutter>
      <StackItem className="rbac-l-stack__item-summary">
        <FormGroup
          label={intl.formatMessage(messages.roleName)}
          helperTextInvalid={roleName ? roleNameError : intl.formatMessage(messages.required)}
          isRequired
          validated={roleNameValidated(roleName, roleNameError)}
        >
          <TextInput
            value={roleName}
            type="text"
            validated={roleNameValidated(roleName, roleNameError)}
            onBlur={() => roleName === '' && setRoleName(undefined)}
            onChange={processRoleName}
            aria-label="Role name"
          />
        </FormGroup>
      </StackItem>
      <StackItem>
        <FormGroup
          label={intl.formatMessage(messages.roleDescription)}
          helperTextInvalid={intl.formatMessage(messages.maxCharactersWarning, { number: 150 })}
          validated={roleDescriptionValidated(roleDescription)}
        >
          <TextArea
            value={roleDescription}
            validated={roleDescriptionValidated(roleDescription)}
            onChange={(value) => {
              setRoleDescription(value);
              formOptions.change('role-description', value);
            }}
            aria-label="Role description"
            resizeOrientation="vertical"
          />
        </FormGroup>
      </StackItem>
    </Stack>
  );
};

SetName.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
};

export default SetName;
