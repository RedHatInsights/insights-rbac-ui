import React from 'react';
import type { IntlShape } from 'react-intl';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { usePlatformEnvironment } from '../../../shared/hooks/usePlatformEnvironment';
import { usePlatformAuth } from '../../../shared/hooks/usePlatformAuth';
import useUserData from '../../hooks/useUserData';
import { OrgAdminDropdown as PresentationalOrgAdminDropdown } from './components/OrgAdminDropdown';
import { useFlag } from '@unleash/proxy-client-react';
import { useUpdateUserOrgAdminMutation } from '../../../shared/data/queries/users';
import messages from '../../../Messages';

const OrgAdminDropdown: React.FC<{
  isOrgAdmin: boolean;
  username: string;
  intl: IntlShape; // Keep for backward compatibility, not used internally
  userId: number | undefined;
  fetchData?: () => void;
}> = ({ isOrgAdmin, username, userId, fetchData }) => {
  const { environment } = usePlatformEnvironment();
  const { getToken } = usePlatformAuth();
  const user = useUserData();
  const intl = useIntl();
  const addNotification = useAddNotification();
  const isITLess = useFlag('platform.rbac.itless');

  const accountId = user.identity?.org_id ?? null;
  const accountUsername = user.identity?.user?.username ?? null;
  const isDisabled = accountUsername === username;

  // React Query mutation for updating org admin status
  const updateOrgAdminMutation = useUpdateUserOrgAdminMutation();

  const handleUpdateOrgAdminStatus = async (newStatus: boolean) => {
    if (updateOrgAdminMutation.isPending) return;
    if (newStatus === isOrgAdmin) return;
    if (userId === undefined) return; // Can't update without a valid user ID

    try {
      const token = await getToken();
      await updateOrgAdminMutation.mutateAsync({
        userId: String(userId),
        isOrgAdmin: newStatus,
        config: { environment, token, accountId },
        itless: isITLess,
      });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.editUserSuccessTitle),
        dismissable: true,
        description: intl.formatMessage(messages.editUserSuccessDescription),
      });
      fetchData?.();
    } catch (error) {
      console.error('Failed to update org admin status:', error);
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.editUserErrorTitle),
        dismissable: true,
        description: intl.formatMessage(messages.editUserErrorDescription),
      });
    }
  };

  return (
    <PresentationalOrgAdminDropdown
      isOrgAdmin={isOrgAdmin}
      username={username}
      isDisabled={isDisabled}
      isLoading={updateOrgAdminMutation.isPending}
      onToggle={handleUpdateOrgAdminStatus}
    />
  );
};

export default OrgAdminDropdown;
