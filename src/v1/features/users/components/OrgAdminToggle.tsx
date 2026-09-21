import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';
import React from 'react';

interface OrgAdminToggleProps {
  isOrgAdmin: boolean;
  username: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  onToggle: (isOrgAdmin: boolean, username: string) => Promise<void> | void;
}

export const OrgAdminToggle: React.FC<OrgAdminToggleProps> = ({ isOrgAdmin, username, isDisabled = false, isLoading = false, onToggle }) => {
  const handleChange = async (_event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    if (isLoading || isDisabled) return;
    if (checked === isOrgAdmin) return;
    await onToggle(checked, username);
  };

  return (
    <Switch
      id={`org-admin-toggle-${username}`}
      aria-label={`Toggle org admin for ${username}`}
      isChecked={isOrgAdmin}
      isDisabled={isDisabled || isLoading}
      onChange={handleChange}
    />
  );
};
