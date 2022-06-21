import React, { useEffect, useContext } from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import { Stack, StackItem } from '@patternfly/react-core';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import Section from '@redhat-cloud-services/frontend-components/Section';
import UsersList from '../group/add-group/users-list';
import ActiveUser from '../../presentational-components/shared/ActiveUsers';
import User from './user';
import paths from '../../utilities/pathnames';
import PageActionRoute from '../common/page-action-route';
import PermissionsContext from '../../utilities/permissions-context';

const Users = () => {
  const activeUserPermissions = useContext(PermissionsContext);

  const description = <ActiveUser linkDescription="To add new users or manage existing users, go to your" />;

  useEffect(() => {
    insights.chrome.appNavClick({ id: 'users', secondaryNav: true });
  }, []);

  const renderUsers = () => (
    <Stack>
      <StackItem>
        <TopToolbar paddingBottm={false}>
          <TopToolbarTitle title="Users" description={description} />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id={'users'}>
          <UsersList
            userLinks={activeUserPermissions.userAccessAdministrator}
            props={{
              isSelectable: false,
              isCompact: false,
            }}
          />
        </Section>
      </StackItem>
    </Stack>
  );

  return (
    <Routes>
      <Route
        path="detail/:username"
        element={
          <PageActionRoute pageAction="user-detail">
            <User />
          </PageActionRoute>
        }
      />
      {/* <Route path={paths.users.path} element={<Routes></Routes>} /> */}
      <Route path="" element={<PageActionRoute pageAction="users-list">{renderUsers()}</PageActionRoute>} />
      {/* <Route path={paths.rbac.path} element={<PageActionRoute pageAction="users-list">{renderUsers()}</PageActionRoute>} /> */}
    </Routes>
  );
};

export default Users;
