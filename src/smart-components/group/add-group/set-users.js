import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  Form,
  FormGroup,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  Title
} from '@patternfly/react-core';
import UsersList from './users-list';
import '../../../App.scss';

const SetUsers = ({ selectedUsers, setSelectedUsers, title, description }) => {
  return (
    <Fragment>
      <Form>
        <Stack gutter="md">
          { title && <StackItem>
            <Title size="xl">{ title }</Title>
          </StackItem> }
          <StackItem>
            <TextContent>
              <Text component={ TextVariants.h6 }>{ description || 'Select users from your organization to add to this group.' }</Text>
            </TextContent>
          </StackItem>
          <StackItem>
            <FormGroup
              fieldId="select-user"
            >
              <Card>
                <UsersList selectedUsers={ selectedUsers } setSelectedUsers={ setSelectedUsers } />
              </Card>
            </FormGroup>
          </StackItem>
        </Stack>
      </Form>
    </Fragment>
  );
};

SetUsers.propTypes = {
  selectedUsers: PropTypes.array,
  setSelectedUsers: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.string
};

export default SetUsers;

