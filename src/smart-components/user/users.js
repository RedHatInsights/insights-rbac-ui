import React, { Fragment } from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { Section } from '@redhat-cloud-services/frontend-components';
import UsersList from '../group/add-group/users-list';
import ActiveUser from '../../presentational-components/shared/ActiveUsers';

const Users = () => {
  const description = (
    <ActiveUser
      description={ (
        <Fragment>
          These are the <b>active</b> users in your organization. To view all users in your organization or add new users, go to your
        </Fragment>
      ) }
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
