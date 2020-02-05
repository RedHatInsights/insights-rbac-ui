import React, {  useState } from 'react';
import {  Stack, StackItem } from '@patternfly/react-core';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { Section } from '@redhat-cloud-services/frontend-components';
import UsersList from '../group/add-group/users-list';

const Users = () => {
  const [ selectedRows, setSelectedRows ] = useState([]);

  const renderUsersList = () =>
    <Stack>
      <StackItem>
        <TopToolbar paddingBottm={ false }>
          <TopToolbarTitle title="Users" />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id={ 'users' }>
          <UsersList
            selectedUsers={ selectedRows }
            setSelectedUsers={ setSelectedRows }
            props={ {
              isSelectable: false,
              isCompact: false
            } }
          />
        </Section>
      </StackItem>
    </Stack>;
  return (
    renderUsersList()
  );
};

Users.propTypes = {

};

Users.defaultProps = {

};

export default Users;
