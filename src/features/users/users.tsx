import React, { useContext, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { usePlatformTracking } from '../../hooks/usePlatformTracking';
import { PageLayout } from '../../components/layout/PageLayout';
import { useFlag } from '@unleash/proxy-client-react';
import Section from '@redhat-cloud-services/frontend-components/Section';
import UsersListNotSelectable from './UsersListNotSelectable';
import { Users as UsersWithDrawer } from '../access-management/users-and-user-groups/users/Users';
import { ActiveUsers } from '../../components/user-management/ActiveUsers';
import PermissionsContext, { PermissionsContextType } from '../../utilities/permissionsContext';
import messages from '../../Messages';
import paths from '../../utilities/pathnames';
import { useLocation } from 'react-router-dom';

const Users: React.FC = () => {
  const intl = useIntl();
  const location = useLocation();
  const activeUserPermissions = useContext(PermissionsContext) as PermissionsContextType;
  const { trackNavigation } = usePlatformTracking();
  const isITLess = useFlag('platform.rbac.itless');
  const isCommonAuthModel = useFlag('platform.rbac.common-auth-model');
  const commonUsersTable = useFlag('platform.rbac.common.userstable');

  const description = <ActiveUsers linkDescription={intl.formatMessage(messages.addNewUsersText)} />;

  useEffect(() => {
    trackNavigation('users', true);
  }, [trackNavigation]);

  const usersListProps = {
    userLinks: activeUserPermissions.userAccessAdministrator || activeUserPermissions.orgAdmin,
    props: {
      isSelectable: !isITLess && !isCommonAuthModel ? false : activeUserPermissions.userAccessAdministrator || activeUserPermissions.orgAdmin,
      isCompact: false,
    },
    usesMetaInURL: isITLess || isCommonAuthModel ? !location.pathname.includes(paths['invite-users'].link()) : true,
  };

  return (
    <PageLayout title={{ title: intl.formatMessage(messages.users), description }}>
      <Section type="content" id="users">
        {commonUsersTable ? <UsersWithDrawer /> : <UsersListNotSelectable {...usersListProps} />}
      </Section>
    </PageLayout>
  );
};
export default Users;
