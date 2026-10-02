import useUserData from '../../hooks/useUserData';
import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { usePlatformTracking } from '../../../shared/hooks/usePlatformTracking';
import { PageLayout } from '../../../shared/components/layout/PageLayout';
import { useCommonAuthModel } from '../../../capabilities/useCommonAuthModel';
import { useFedRAMPMode } from '../../../capabilities/useFedRAMPMode';
import Section from '@redhat-cloud-services/frontend-components/Section';
import UsersListNotSelectable from './UsersListNotSelectable';
import { ActiveUsers } from '../../components/user-management/ActiveUsers';

import paths from '../../utilities/pathnames';
import { useLocation } from 'react-router-dom';
import { commonMessages } from '../../../shared/messages/common';

const Users: React.FC = () => {
  const intl = useIntl();
  const location = useLocation();
  const activeUserPermissions = useUserData();
  const { trackNavigation } = usePlatformTracking();
  const isITLess = useFedRAMPMode();
  const { isEnabled: isCommonAuthModel } = useCommonAuthModel();

  const description = (
    <ActiveUsers
      linkDescription={intl.formatMessage({
        id: 'addNewUsersText',
        defaultMessage:
          'For more advanced user management, including adding users directly, editing details (like job title and language), and managing Customer Portal access, visit the',
        description: 'Add new users text',
      })}
    />
  );

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
    <PageLayout title={{ title: intl.formatMessage(commonMessages.users), description }}>
      <Section type="content" id="users">
        <UsersListNotSelectable {...usersListProps} />
      </Section>
    </PageLayout>
  );
};
export default Users;
