import React, { useEffect, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Stack, StackItem } from '@patternfly/react-core';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { useIntl } from 'react-intl';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import Section from '@redhat-cloud-services/frontend-components/Section';
import UsersListNotSelectable from './users-list-not-selectable';
import ActiveUser from '../../presentational-components/shared/ActiveUsers';
import PermissionsContext from '../../utilities/permissions-context';
import messages from '../../Messages';
import UsersListItless from '../group/add-group/users-list-itless';
import User from './user';
import PageActionRoute from '../common/page-action-route';
import pathnames from '../../utilities/pathnames';
import InviteUsersModal from './invite-users/invite-users-modal';

const Users = () => {
  const intl = useIntl();
  const activeUserPermissions = useContext(PermissionsContext);
  const { appNavClick, isFedramp } = useChrome();

  const description = <ActiveUser linkDescription={intl.formatMessage(messages.addNewUsersText)} />;

  useEffect(() => {
    appNavClick({ id: 'users', secondaryNav: true });
  }, []);

  const usersListProps = {
    userLinks: activeUserPermissions.userAccessAdministrator || activeUserPermissions.orgAdmin,
    props: {
      isSelectable: !isFedramp ? false : activeUserPermissions.userAccessAdministrator || activeUserPermissions.orgAdmin,
      isCompact: false,
    },
    usesMetaInURL: true,
  };

  const renderUsers = () => (
    <Stack>
      <StackItem>
        <TopToolbar>
          <TopToolbarTitle title={intl.formatMessage(messages.users)} description={description} />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id="users">
          {isFedramp ? <UsersListItless {...usersListProps} /> : <UsersListNotSelectable {...usersListProps} />}
        </Section>
      </StackItem>
    </Stack>
  );

  if (!isFedramp) {
    return renderUsers();
  }

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
      <Route path={pathnames['invite-users'].path} element={<InviteUsersModal fetchData={() => {}} />} />
    </Routes>
  );
};
export default Users;
