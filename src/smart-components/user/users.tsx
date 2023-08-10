import React, { useEffect, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Stack, StackItem } from '@patternfly/react-core';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { useIntl } from 'react-intl';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import Section from '@redhat-cloud-services/frontend-components/Section';
import UsersList from '../group/add-group/users-list';
import User from './user';
import PageActionRoute from '../common/page-action-route';
import PermissionsContext from '../../utilities/permissions-context';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import InviteUsersModal from './invite-users/invite-users-modal';

const Users = () => {
  const intl = useIntl();
  const activeUserPermissions = useContext(PermissionsContext);
  const { appNavClick } = useChrome();

  useEffect(() => {
    appNavClick({ id: 'users', secondaryNav: true });
  }, []);

  const renderUsers = () => (
    <Stack>
      <StackItem>
        <TopToolbar>
          <TopToolbarTitle title={intl.formatMessage(messages.users)} />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id="users">
          <UsersList
            userLinks={activeUserPermissions.userAccessAdministrator || activeUserPermissions.orgAdmin}
            props={{
              isSelectable: activeUserPermissions.orgAdmin,
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
      <Route
        path={pathnames['invite-users'].path}
        element={
          <InviteUsersModal
            fetchData={() => {}}
          />
        }
      />
    </Routes>
  );
};
export default Users;
