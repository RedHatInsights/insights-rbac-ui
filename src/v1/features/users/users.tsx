import useUserData from '../../hooks/useUserData';
import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { usePlatformTracking } from '../../../shared/hooks/usePlatformTracking';
import { PageLayout } from '../../../shared/components/layout/PageLayout';
import { useFlag } from '@unleash/proxy-client-react';
import Section from '@redhat-cloud-services/frontend-components/Section';
import UsersListNotSelectable from './UsersListNotSelectable';
import { ActiveUsers } from '../../components/user-management/ActiveUsers';
import messages from '../../../Messages';
import paths from '../../utilities/pathnames';
import { useLocation } from 'react-router-dom';

const Users: React.FC = () => {
  const intl = useIntl();
  const location = useLocation();
  const activeUserPermissions = useUserData();
  const { trackNavigation } = usePlatformTracking();
  const isITLess = useFlag('platform.rbac.itless');
  const isCommonAuthModel = useFlag('platform.rbac.common-auth-model');

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
        <UsersListNotSelectable {...usersListProps} />
      </Section>
    </PageLayout>
  );
};
export default Users;
