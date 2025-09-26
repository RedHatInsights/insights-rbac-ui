import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { FormHelperText } from '@patternfly/react-core';
import { HelperText } from '@patternfly/react-core';
import { HelperTextItem } from '@patternfly/react-core';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';
import { TextInput } from '@patternfly/react-core';
import { debouncedAsyncValidator } from './validators';
import { trimAll } from '../../../helpers/stringUtilities';
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
    const trimmedValue = trimAll(value);
    input.onChange(undefined);
    debouncedAsyncValidator(trimmedValue)
      .then(() => {
        input.onChange(trimmedValue);
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

  const roleNameValid = roleNameValidated(roleName, roleNameError);
  const roleDescriptionValid = roleDescriptionValidated(roleDescription);
  return (
    <Stack hasGutter>
      <StackItem className="rbac-l-stack__item-summary">
        <FormGroup label={intl.formatMessage(messages.roleName)} isRequired>
          <TextInput
            id="role-name"
            value={roleName}
            type="text"
            validated={roleNameValid}
            onBlur={() => roleName === '' && setRoleName(undefined)}
            onChange={(_event, value) => processRoleName(value)}
            aria-label="Role name"
          />
          {roleNameValid === 'error' && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant={roleNameValid}>{roleName ? roleNameError : intl.formatMessage(messages.required)}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
        </FormGroup>
      </StackItem>
      <StackItem>
        <FormGroup label={intl.formatMessage(messages.roleDescription)}>
          <TextArea
            id="role-description"
            value={roleDescription}
            validated={roleDescriptionValid}
            onChange={(_event, value) => {
              setRoleDescription(value);
              formOptions.change('role-description', value);
            }}
            aria-label="Role description"
            resizeOrientation="vertical"
          />
          {roleDescriptionValid === 'error' && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant={roleDescriptionValid}>{intl.formatMessage(messages.maxCharactersWarning, { number: 150 })}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
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
