import React, { useContext, useEffect } from 'react';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { useIntl } from 'react-intl';
import { PageLayout, PageTitle } from '../../components/layout/PageLayout';
import { useFlag } from '@unleash/proxy-client-react';
import Section from '@redhat-cloud-services/frontend-components/Section';
import UsersListNotSelectable from './users-list-not-selectable';
import { ActiveUsers } from '../../components/user-management/ActiveUsers';
import PermissionsContext, { PermissionsContextType } from '../../utilities/permissionsContext';
import messages from '../../Messages';
import paths from '../../utilities/pathnames';
import { useLocation } from 'react-router-dom';

const Users: React.FC = () => {
  const intl = useIntl();
  const location = useLocation();
  const activeUserPermissions = useContext(PermissionsContext) as PermissionsContextType;
  const { appNavClick } = useChrome();
  const isITLess = useFlag('platform.rbac.itless');
  const isCommonAuthModel = useFlag('platform.rbac.common-auth-model');
  const commonUsersTable = useFlag('platform.rbac.common.userstable');

  const description = <ActiveUsers linkDescription={intl.formatMessage(messages.addNewUsersText)} />;

  useEffect(() => {
    appNavClick({ id: 'users', secondaryNav: true });
  }, []);

  const usersListProps = {
    userLinks: activeUserPermissions.userAccessAdministrator || activeUserPermissions.orgAdmin,
    props: {
      isSelectable: !isITLess && !isCommonAuthModel ? false : activeUserPermissions.userAccessAdministrator || activeUserPermissions.orgAdmin,
      isCompact: false,
    },
    usesMetaInURL: isITLess || isCommonAuthModel ? !location.pathname.includes(paths['invite-users'].link) : true,
  };

  return (
    <Stack>
      <StackItem>
        <PageLayout>
          <PageTitle title={intl.formatMessage(messages.users)} description={description} />
        </PageLayout>
      </StackItem>
      <StackItem>
        <Section type="content" id="users">
          {!commonUsersTable ? (
            isITLess ? (
              <UsersListNotSelectable {...usersListProps} />
            ) : (
              <UsersListNotSelectable {...usersListProps} />
            )
          ) : (
            <UsersListNotSelectable {...usersListProps} />
          )}
        </Section>
      </StackItem>
    </Stack>
  );
};
export default Users;
