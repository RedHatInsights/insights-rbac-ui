import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { FormHelperText, HelperText, HelperTextItem, Stack, StackItem } from '@patternfly/react-core';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { TextInput } from '@patternfly/react-core';
import { TextArea } from '@patternfly/react-core';
import { FormGroup } from '@patternfly/react-core';
import { debouncedAsyncValidator } from '../validators';
import { trimAll } from '../../../helpers/shared/helpers';
import messages from '../../../Messages';

const groupNameValidated = (groupName, groupNameError) =>
  groupName === undefined || groupNameError || groupName?.length > 150 ? 'error' : 'default';
const groupDescriptionValidated = (groupDescription) => (groupDescription?.length > 150 ? 'error' : 'default');

const SetName = (props) => {
  const intl = useIntl();
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const { 'group-name': name, 'group-description': description } = formOptions.getState().values;
  const [groupName, setGroupName] = useState(name || '');
  const [groupNameError, setGroupNameError] = useState();
  const [groupDescription, setGroupDescription] = useState(description);

  const processGroupName = (value) => {
    const trimmedValue = trimAll(value);
    input.onChange(undefined);
    debouncedAsyncValidator(trimmedValue)
      .then(() => {
        input.onChange(trimmedValue);
        setGroupNameError(undefined);
      })
      .catch((error) => {
        setGroupNameError(error);
        input.onChange(undefined);
      });
    setGroupName(value);
  };

  useEffect(() => {
    groupName?.length > 0 && processGroupName(groupName);
  }, []);

  const groupNameValid = groupNameValidated(groupName, groupNameError);
  const groupDescriptionValid = groupDescriptionValidated(groupDescription);
  return (
    <Stack hasGutter>
      <StackItem className="rbac-l-stack__item-summary">
        <FormGroup label={intl.formatMessage(messages.groupName)} isRequired>
          <TextInput
            value={groupName}
            type="text"
            validated={groupNameValid}
            onBlur={() => groupName === '' && setGroupName(undefined)}
            onChange={(_event, value) => processGroupName(value)}
            aria-label="Group name"
          />
          {groupNameValid === 'error' && (
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant={groupNameValid}>{groupName ? groupNameError : intl.formatMessage(messages.required)}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          )}
        </FormGroup>
      </StackItem>
      <StackItem>
        <FormGroup label={intl.formatMessage(messages.groupDescription)}>
          <TextArea
            value={groupDescription}
            validated={groupDescriptionValid}
            onChange={(_event, value) => {
              setGroupDescription(value);
              formOptions.change('group-description', value);
            }}
            aria-label="Group description"
            resizeOrientation="vertical"
          />
          {groupDescriptionValid === 'error' && (
            <FormHelperText>
              <HelperText variant={groupDescriptionValid}>
                <HelperTextItem>{intl.formatMessage(messages.maxCharactersWarning, { number: 150 })}</HelperTextItem>
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
  groups: PropTypes.array,
};

export default SetName;
