import React from 'react';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';

interface OrgAdminToggleProps {
  isOrgAdmin: boolean;
  username: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  onToggle: (isOrgAdmin: boolean, username: string) => Promise<void> | void;
}

export const OrgAdminToggle: React.FC<OrgAdminToggleProps> = ({ isOrgAdmin, username, isDisabled = false, isLoading = false, onToggle }) => {
  const handleChange = (_event: unknown, checked: boolean) => {
    if (isLoading || isDisabled) return;
    if (checked === isOrgAdmin) return;
    void onToggle(checked, username);
  };

  return (
    <span onClick={(e) => e.stopPropagation()} role="presentation">
      <Switch
        id={`${username}-org-admin-switch`}
        aria-label={`Toggle org admin for ${username}`}
        isChecked={isOrgAdmin}
        isDisabled={isDisabled || isLoading}
        onChange={handleChange}
        ouiaId={`${username}-org-admin-switch`}
      />
    </span>
  );
};
