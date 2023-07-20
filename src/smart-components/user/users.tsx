import React, { useEffect, useContext } from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { useIntl } from 'react-intl';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import Section from '@redhat-cloud-services/frontend-components/Section';
import UsersListNotSelectable from './users-list-not-selectable';
import ActiveUser from '../../presentational-components/shared/ActiveUsers';
import PermissionsContext from '../../utilities/permissions-context';
import messages from '../../Messages';

const Users = () => {
  const intl = useIntl();
  const activeUserPermissions = useContext(PermissionsContext);
  const { appNavClick } = useChrome();

  console.log('test deploy log');

  const description = <ActiveUser linkDescription={intl.formatMessage(messages.addNewUsersText)} />;

  useEffect(() => {
    appNavClick({ id: 'users', secondaryNav: true });
  }, []);

  return (
    <Stack>
      <StackItem>
        <TopToolbar>
          <TopToolbarTitle title={intl.formatMessage(messages.users)} description={description} />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id="users">
          <UsersListNotSelectable
            userLinks={activeUserPermissions.userAccessAdministrator || activeUserPermissions.orgAdmin}
            props={{
              isSelectable: false,
              isCompact: false,
            }}
            usesMetaInURL
          />
        </Section>
      </StackItem>
    </Stack>
  );
};
export default Users;
