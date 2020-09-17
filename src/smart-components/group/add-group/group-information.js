import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Form, FormGroup, Stack, StackItem, TextInput, TextArea, Title } from '@patternfly/react-core';
import { debouncedAsyncValidator } from './validators';
const GroupInformation = (formValue, onHandleChange, setIsGroupInfoValid, isGroupInfoValid, isValidating, setIsValidating) => (
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
                ? 'This group name already exists. Please input a unique group name.'
                : 'Required value'
            }
            validated={isGroupInfoValid || formValue.name === undefined ? 'success' : 'error'}
          >
            <TextInput
              isRequired
              type="text"
              id="group-name"
              name="group-name"
              aria-describedby="group-name"
              value={formValue.name}
              validated={isGroupInfoValid || formValue.name === undefined ? 'default' : 'error'}
              onChange={(_, event) => {
                const { value } = event.currentTarget;
                onHandleChange({ name: value });
                setIsValidating(true);
                (async () => {
                  const isUnique = formValue.name !== undefined && (await debouncedAsyncValidator(value));
                  setIsGroupInfoValid(value.trim().length > 0 && isUnique);
                  setIsValidating(false);
                })();
              }}
            />
          </FormGroup>
          <FormGroup label="Group description" fieldId="group-description">
            <TextArea
              type="text"
              id="group-description"
              name="group-description"
              value={formValue.description}
              onChange={(_, event) => onHandleChange({ description: event.currentTarget.value })}
            />
          </FormGroup>
        </Form>
      </StackItem>
    </Stack>
  </Fragment>
);

GroupInformation.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
};

export default GroupInformation;
