import React, { useEffect, useContext } from 'react';
import { Switch } from 'react-router-dom';
import { Stack, StackItem } from '@patternfly/react-core';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import Section from '@redhat-cloud-services/frontend-components/Section';
import UsersList from '../group/add-group/users-list';
import ActiveUser from '../../presentational-components/shared/ActiveUsers';
import User from './user';
import paths from '../../utilities/pathnames';
import PageActionRoute from '../common/page-action-route';
import PermissionsContext from '../../utilities/permissions-context';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

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
              isSelectable: false,
              isCompact: false,
            }}
          />
        </Section>
      </StackItem>
    </Stack>
  );

  return (
    <Switch>
      <PageActionRoute pageAction="user-detail" path={paths['user-detail'].path} render={() => <User />} />
      <PageActionRoute pageAction="users-list" path={[paths.users.path, paths.rbac.path]} render={() => renderUsers()} />
    </Switch>
  );
};

export default Users;
