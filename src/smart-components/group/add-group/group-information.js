import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Form,
  FormGroup,
  Stack,
  StackItem,
  TextInput,
  TextArea,
  Title
} from '@patternfly/react-core';

const GroupInformation = (formValue, onHandleChange, setIsGroupInfoValid) => {
  return (
    <Fragment>
      <Stack gutter="md">
        <StackItem>
          <Title size="xl"> Enter group information </Title>
        </StackItem>
        <StackItem>
          <Form>
            <FormGroup
              label="Group name"
              isRequired
              fieldId="group-name"
            >
              <TextInput
                isRequired
                type="text"
                id="group-name"
                name="group-name"
                aria-describedby="group-name"
                value={ formValue.name }
                onChange={ (_, event) => { setIsGroupInfoValid(event.currentTarget.value.trim().length > 0);
                  onHandleChange({ name: event.currentTarget.value });} }
              />
            </FormGroup>
            <FormGroup label="Description" fieldId="group-description">
              <TextArea
                type="text"
                id="group-description"
                name="group-description"
                value={ formValue.description }
                onChange={ (_, event) => onHandleChange({ description: event.currentTarget.value }) }
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
  description: PropTypes.string
};

export default GroupInformation;
