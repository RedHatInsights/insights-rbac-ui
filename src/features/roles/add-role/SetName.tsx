import React, { useEffect, useState } from 'react';
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

const roleNameValidated = (roleName: string | undefined, roleNameError: string | undefined): 'error' | 'default' =>
  roleName === undefined || roleNameError || (roleName?.length ?? 0) > 150 ? 'error' : 'default';

const roleDescriptionValidated = (roleDescription: string | undefined): 'error' | 'default' =>
  (roleDescription?.length ?? 0) > 150 ? 'error' : 'default';

interface SetNameProps {
  name: string;
  description?: string;
}

const SetName: React.FC<SetNameProps> = (props) => {
  const intl = useIntl();
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const { 'role-name': name, 'role-description': description } = formOptions.getState().values;
  const [roleName, setRoleName] = useState<string | undefined>(name || '');
  const [roleNameError, setRoleNameError] = useState<string | undefined>();
  const [roleDescription, setRoleDescription] = useState<string | undefined>(description);

  const processRoleName = (value: string) => {
    const trimmedValue = trimAll(value);
    input.onChange(undefined);
    debouncedAsyncValidator(trimmedValue)
      .then(() => {
        input.onChange(trimmedValue);
        setRoleNameError(undefined);
      })
      .catch((error: string) => {
        setRoleNameError(error);
        input.onChange(undefined);
      });
    setRoleName(value);
  };

  useEffect(() => {
    roleName && roleName.length > 0 && processRoleName(roleName);
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

export default SetName;
