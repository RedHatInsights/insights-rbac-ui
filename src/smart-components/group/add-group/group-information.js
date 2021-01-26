import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { Form, FormGroup, Stack, StackItem, TextInput, TextArea, Title } from '@patternfly/react-core';
import { debouncedAsyncValidator } from './validators';
const GroupInformation = (formValue, onHandleChange, setIsGroupInfoValid, isGroupInfoValid, isValidating, setIsValidating) => {
  const [nameValid, setNameValid] = useState(true);
  const [descriptionValid, setDescriptionValid] = useState(true);
  return (
    <Fragment>
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h4" size="xl">
            Name and description
          </Title>
        </StackItem>
        <StackItem>
          <Form>
            <FormGroup
              label="Group name"
              isRequired
              fieldId="group-name"
              helperTextInvalid={
                formValue.name?.trim().length > 0 && !isValidating
                  ? formValue.name?.length < 150
                    ? 'This group name already exists. Please input a unique group name.'
                    : 'Group name can have maximum of 150 characters'
                  : 'Required value'
              }
              validated={nameValid || formValue.name === undefined ? 'success' : 'error'}
            >
              <TextInput
                isRequired
                type="text"
                id="group-name"
                name="group-name"
                aria-describedby="group-name"
                value={formValue.name}
                validated={nameValid ? 'default' : 'error'}
                onChange={(_, event) => {
                  const { value } = event.currentTarget;
                  onHandleChange({ name: value });
                  setIsValidating(true);
                  (async () => {
                    const isUnique = formValue.name !== undefined && (await debouncedAsyncValidator(value));
                    const valid = value.trim().length > 0 && isUnique && value.length < 150;
                    setNameValid(valid);
                    setIsGroupInfoValid(valid && descriptionValid);
                    setIsValidating(false);
                  })();
                }}
              />
            </FormGroup>
            <FormGroup
              label="Group description"
              fieldId="group-description"
              helperTextInvalid={'Group description can have maximum of 150 characters'}
              validated={descriptionValid ? 'success' : 'error'}
            >
              <TextArea
                type="text"
                id="group-description"
                name="group-description"
                value={formValue.description}
                onChange={(_, event) => {
                  setNameValid(formValue.name !== undefined && nameValid);
                  setDescriptionValid(event.currentTarget.value.length < 150);
                  setIsGroupInfoValid(nameValid && event.currentTarget.value.length < 150);
                  onHandleChange({ description: event.currentTarget.value });
                }}
              />
            </FormGroup>
          </Form>
        </StackItem>
      </Stack>
    </Fragment>
  );
};

GroupInformation.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
};

export default GroupInformation;
