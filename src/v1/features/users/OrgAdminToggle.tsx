import React from 'react';
import useUserData from '../../hooks/useUserData';
import { OrgAdminToggle as PresentationalOrgAdminToggle } from './components/OrgAdminToggle';
import { useUpdateUserOrgAdminMutation } from '../../../shared/data/queries/users';

export const OrgAdminToggle: React.FC<{
  isOrgAdmin: boolean;
  username: string;
  userId: number | undefined;
  isActive: boolean;
  fetchData?: () => void;
}> = ({ isOrgAdmin, username, userId, isActive, fetchData }) => {
  const user = useUserData();
  const accountUsername = user.identity?.user?.username ?? null;
  const isSelf = accountUsername === username;
  const isDisabled = isSelf || !user.orgAdmin || !isActive;

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
    <PresentationalOrgAdminToggle
      isOrgAdmin={isOrgAdmin}
      username={username}
      isDisabled={isDisabled}
      isLoading={updateOrgAdminMutation.isPending}
      onToggle={handleUpdateOrgAdminStatus}
    />
  );
};
