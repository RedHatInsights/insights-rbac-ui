import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  Form,
  FormGroup,
  Stack,
  StackItem,
  TextContent,
  Title
} from '@patternfly/react-core';
import UsersList from './users-list';
import '../../../App.scss';
import ActiveUser from '../../../presentational-components/shared/ActiveUsers';

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
              <Title headingLevel="h4" size="xl"> Add members to the group </Title>
            </TextContent>
            <ActiveUser
              description={ (
                description ||
                'Select users from your organization to add to this group. This list only shows active users; to see all users in your organization go to your'
              ) }
            />
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

