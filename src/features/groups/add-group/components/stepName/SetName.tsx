import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { FormHelperText } from '@patternfly/react-core';
import { HelperText } from '@patternfly/react-core';
import { HelperTextItem } from '@patternfly/react-core';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { TextInput } from '@patternfly/react-core';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { debouncedAsyncValidator } from '../../../validators';
import { trimAll } from '../../../../../helpers/stringUtilities';
import messages from '../../../../../Messages';

interface SetNameProps {
  name: string;
  // Data-driven-forms pass-through props
  input?: { onChange: (value: unknown) => void; value: unknown };
  meta?: { error?: string; touched?: boolean };
  [key: string]: unknown;
}

const groupNameValidated = (groupName?: string, groupNameError?: string): 'error' | 'default' =>
  groupName === undefined || groupNameError || (groupName?.length ?? 0) > 150 ? 'error' : 'default';

const groupDescriptionValidated = (groupDescription?: string): 'error' | 'default' => ((groupDescription?.length ?? 0) > 150 ? 'error' : 'default');

export const SetName: React.FC<SetNameProps> = (props) => {
  const intl = useIntl();
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const { 'group-name': name, 'group-description': description } = formOptions.getState().values || {};
  const [groupName, setGroupName] = useState<string>(name || '');
  const [groupNameError, setGroupNameError] = useState<string | undefined>();
  const [groupDescription, setGroupDescription] = useState<string>(description || '');

  const processGroupName = (value: string) => {
    const trimmedValue = trimAll(value);
    input.onChange(undefined);
    debouncedAsyncValidator(trimmedValue, 'uuid', '')
      .then(() => {
        input.onChange(trimmedValue);
        setGroupNameError(undefined);
      })
      .catch((error: string) => {
        setGroupNameError(error);
        input.onChange(undefined);
      });
    setGroupName(value);
  };

  useEffect(() => {
    formOptions.change('group-name', name);
    formOptions.change('group-description', description);
  }, []);

  useEffect(() => {
    if (groupName?.trim?.()?.length > 0) {
      processGroupName(groupName);
    }
  }, []);

  return (
    <Stack hasGutter>
      <StackItem>
        <FormGroup label={intl.formatMessage(messages.name)} isRequired fieldId="group-name">
          <TextInput
            type="text"
            id="group-name"
            aria-describedby="group-name"
            name="group-name"
            value={groupName}
            onChange={(_event, value: string) => processGroupName(value)}
            validated={groupNameValidated(groupName, groupNameError)}
            placeholder="Enter group name"
          />
          <FormHelperText>
            <HelperText>
              {groupNameError && <HelperTextItem variant="error">{groupNameError}</HelperTextItem>}
              {groupName?.length > 150 && (
                <HelperTextItem variant="error">{intl.formatMessage(messages.maxCharactersWarning, { number: 150 })}</HelperTextItem>
              )}
              {!groupNameError && groupName?.length <= 150 && <HelperTextItem>{'Provide a unique name for the group'}</HelperTextItem>}
            </HelperText>
          </FormHelperText>
        </FormGroup>
      </StackItem>
      <StackItem>
        <FormGroup label={intl.formatMessage(messages.description)} fieldId="group-description">
          <TextArea
            type="text"
            id="group-description"
            name="group-description"
            value={groupDescription}
            onChange={(_event, value: string) => {
              setGroupDescription(value);
              formOptions.change('group-description', value);
            }}
            validated={groupDescriptionValidated(groupDescription)}
            placeholder="Enter group description (optional)"
          />
          <FormHelperText>
            <HelperText>
              {(groupDescription?.length ?? 0) > 150 && (
                <HelperTextItem variant="error">{intl.formatMessage(messages.maxCharactersWarning, { number: 150 })}</HelperTextItem>
              )}
              {(groupDescription?.length ?? 0) <= 150 && <HelperTextItem>{'Optional field'}</HelperTextItem>}
            </HelperText>
          </FormHelperText>
        </FormGroup>
      </StackItem>
    </Stack>
  );
};
