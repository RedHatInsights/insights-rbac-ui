import React, { useEffect, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Stack, StackItem } from '@patternfly/react-core';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { useIntl } from 'react-intl';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import Section from '@redhat-cloud-services/frontend-components/Section';
import UsersList from '../group/add-group/users-list';
import ActiveUser from '../../presentational-components/shared/ActiveUsers';
import User from './user';
import PageActionRoute from '../common/page-action-route';
import PermissionsContext from '../../utilities/permissions-context';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';

const Users = () => {
  const intl = useIntl();
  const activeUserPermissions = useContext(PermissionsContext);
  const { appNavClick } = useChrome();

  const description = <ActiveUser linkDescription={intl.formatMessage(messages.addNewUsersText)} />;

  useEffect(() => {
    appNavClick({ id: 'users', secondaryNav: true });
  }, []);

  const renderUsers = () => (
    <Stack>
      <StackItem>
        <TopToolbar>
          <TopToolbarTitle title={intl.formatMessage(messages.users)} description={description} />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id="users">
          <UsersList
            userLinks={activeUserPermissions.userAccessAdministrator || activeUserPermissions.orgAdmin}
            props={{
              isSelectable: activeUserPermissions.userAccessAdministrator || activeUserPermissions.orgAdmin,
              isCompact: false,
            }}
            usesMetaInURL
          />
        </Section>
      </StackItem>
    </Stack>
  );

  return (
    <Routes>
      <Route
        path={pathnames['user-detail'].path}
        element={
          <PageActionRoute pageAction="user-detail">
            <User />
          </PageActionRoute>
        }
      />
      <Route path="" element={<PageActionRoute pageAction="users-list">{renderUsers()}</PageActionRoute>} />
    </Routes>
  );
};
export default Users;
