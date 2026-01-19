import React, { useEffect, useState } from 'react';
import { IntlShape } from 'react-intl';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { OrgAdminDropdown as PresentationalOrgAdminDropdown } from './components/OrgAdminDropdown';
import { useFlag } from '@unleash/proxy-client-react';
import { useUpdateUserOrgAdminMutation } from '../../data/queries/users';
import messages from '../../Messages';

const OrgAdminDropdown: React.FC<{
  isOrgAdmin: boolean;
  username: string;
  intl: IntlShape; // Keep for backward compatibility, not used internally
  userId: number | undefined;
  fetchData?: () => void;
}> = ({ isOrgAdmin, username, userId, fetchData }) => {
  const { auth, isProd } = useChrome();
  const intl = useIntl();
  const addNotification = useAddNotification();
  const [isDisabled, setIsDisabled] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountUsername, setAccountUsername] = useState<string | null>(null);
  const isITLess = useFlag('platform.rbac.itless');

  // React Query mutation for updating org admin status
  const updateOrgAdminMutation = useUpdateUserOrgAdminMutation();

  useEffect(() => {
    const getToken = async () => {
      const user = await auth.getUser();
      setAccountId(user?.identity?.org_id ?? null);
      setAccountUsername(user?.identity?.user?.username ?? null);
      setToken((await auth.getToken()) ?? null);
    };
    getToken();
  }, [auth]);

  useEffect(() => {
    if (accountUsername === username) {
      setIsDisabled(true);
    }
  }, [username, accountUsername]);

  const handleUpdateOrgAdminStatus = async (newStatus: boolean) => {
    if (updateOrgAdminMutation.isPending) return;
    if (newStatus === isOrgAdmin) return;
    if (userId === undefined) return; // Can't update without a valid user ID

    try {
      await updateOrgAdminMutation.mutateAsync({
        userId: String(userId),
        isOrgAdmin: newStatus,
        config: { isProd: isProd() || false, token, accountId },
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
