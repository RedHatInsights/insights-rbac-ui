import React from 'react';
import type { IntlShape } from 'react-intl';
import useUserData from '../../hooks/useUserData';
import { OrgAdminDropdown as PresentationalOrgAdminDropdown } from './components/OrgAdminDropdown';
import { useUpdateUserOrgAdminMutation } from '../../../shared/data/queries/users';

const OrgAdminDropdown: React.FC<{
  isOrgAdmin: boolean;
  username: string;
  intl: IntlShape; // Keep for backward compatibility, not used internally
  userId: number | undefined;
  fetchData?: () => void;
}> = ({ isOrgAdmin, username, userId, fetchData }) => {
  const user = useUserData();
  const accountUsername = user.identity?.user?.username ?? null;
  const isDisabled = accountUsername === username;

  const updateOrgAdminMutation = useUpdateUserOrgAdminMutation();

  const handleUpdateOrgAdminStatus = async (newStatus: boolean) => {
    if (updateOrgAdminMutation.isPending) return;
    if (newStatus === isOrgAdmin) return;
    if (userId === undefined) return;

    await updateOrgAdminMutation.mutateAsync({
      userId: String(userId),
      isOrgAdmin: newStatus,
    });
    fetchData?.();
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
