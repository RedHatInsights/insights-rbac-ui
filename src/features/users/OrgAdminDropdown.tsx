import React, { useEffect, useState } from 'react';
import { IntlShape } from 'react-intl';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useDispatch } from 'react-redux';
import { updateUserIsOrgAdminStatus } from '../../redux/users/actions';
import { OrgAdminDropdown as PresentationalOrgAdminDropdown } from './components/OrgAdminDropdown';
import { useFlag } from '@unleash/proxy-client-react';

const OrgAdminDropdown: React.FC<{
  isOrgAdmin: boolean;
  username: string;
  intl: IntlShape; // Keep for backward compatibility, not used internally
  userId: number | undefined;
  fetchData?: () => void;
}> = ({ isOrgAdmin, username, userId, fetchData }) => {
  const { auth, isProd } = useChrome();
  const [isDisabled, setIsDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountUsername, setAccountUsername] = useState<string | null>(null);
  const dispatch = useDispatch();
  const isITLess = useFlag('platform.rbac.itless');

  useEffect(() => {
    const getToken = async () => {
      setAccountId((await auth.getUser())?.identity?.org_id as string);
      setAccountUsername((await auth.getUser())?.identity?.user?.username as string);
      setToken((await auth.getToken()) as string);
    };
    getToken();
  }, [auth]);

  useEffect(() => {
    if (accountUsername === username) {
      setIsDisabled(true);
    }
  }, [username, accountUsername]);

  const handleUpdateOrgAdminStatus = async (newStatus: boolean) => {
    if (loading) return;
    if (newStatus === isOrgAdmin) return;
    if (userId === undefined) return; // Can't update without a valid user ID

    setLoading(true);

    try {
      await dispatch(updateUserIsOrgAdminStatus({ id: String(userId), is_org_admin: newStatus }, { isProd: isProd(), token, accountId }, isITLess));
      fetchData?.();
    } catch (error) {
      console.error('Failed to update org admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PresentationalOrgAdminDropdown
      isOrgAdmin={isOrgAdmin}
      username={username}
      isDisabled={isDisabled}
      isLoading={loading}
      onToggle={handleUpdateOrgAdminStatus}
    />
  );
};

export default OrgAdminDropdown;
