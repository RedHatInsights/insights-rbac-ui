import React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { Section } from '@redhat-cloud-services/frontend-components';
import UsersList from '../group/add-group/users-list';
import ActiveUser from '../../presentational-components/shared/ActiveUsers';

const Users = () => {
  const description = (
    <ActiveUser
      description="These are the users in your organization. To add new users to your organization, go to"
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
