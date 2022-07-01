/* eslint-disable */
import React, { useEffect, useContext } from 'react';
import { Link, Route, Switch, useHistory } from 'react-router-dom';
import { Stack, StackItem } from '@patternfly/react-core';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { Section } from '@redhat-cloud-services/frontend-components';
import UsersList from '../group/add-group/users-list';
import ActiveUser from '../../presentational-components/shared/ActiveUsers';
import User from './user';
import paths from '../../utilities/pathnames';
import PageActionRoute from '../common/page-action-route';
import PermissionsContext from '../../utilities/permissions-context';

const Users = () => {
  const activeUserPermissions = useContext(PermissionsContext);

  const description = (
    <ActiveUser
      linkDescription="To add new users or manage existing users, go to your"
    />
  );

  useEffect(() => {
    insights.chrome.appNavClick({ id: 'users', secondaryNav: true });
  }, []);

  const renderUsers = () => <Stack >
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
          userLinks={activeUserPermissions.userAccessAdministrator || activeUserPermissions.orgAdmin}
          props={ {
            isSelectable: false,
            isCompact: false
          } }
        />
      </Section>
    </StackItem>
  </Stack >;

  return (
    <Switch>
      <PageActionRoute pageAction="user-detail" exact path={ paths['user-detail'] } render={ props => <User {...props}/> } />
      <PageActionRoute pageAction="users-list" path={ [ paths.users, paths.rbac] } render={ () => renderUsers() } />
    </Switch>

  );
};

Users.propTypes = {

};

Users.defaultProps = {

};

export default Users;
