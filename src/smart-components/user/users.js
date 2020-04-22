import React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { Section } from '@redhat-cloud-services/frontend-components';
import UsersList from '../group/add-group/users-list';
import ActiveUser from '../../presentational-components/shared/ActiveUsers';

const Users = () => {
  const description = (
    <ActiveUser
      description="These are all of the users in your Red Hat organization. To add new users or manage existing users, go to your"
    />);

  return (
    <Stack >
      <StackItem>
        <TopToolbar paddingBottm={ false }>
          <TopToolbarTitle
            title="Users"
            description={ description }
          />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id={ 'users' }>
          <UsersList
            props={ {
              isSelectable: false,
              isCompact: false
            } }
          />
        </Section>
      </StackItem>
    </Stack >
  );
};

Users.propTypes = {

};

Users.defaultProps = {

};

export default Users;
