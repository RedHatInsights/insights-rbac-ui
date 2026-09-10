import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';
import React from 'react';

interface OrgAdminToggleProps {
  isOrgAdmin: boolean;
  username: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  onToggle: (isOrgAdmin: boolean) => void;
}

export const OrgAdminToggle: React.FC<OrgAdminToggleProps> = ({ isOrgAdmin, username, isDisabled = false, isLoading = false, onToggle }) => {
  return (
    <Switch
      id={`${username}-org-admin-switch`}
      aria-label={`Toggle org admin for ${username}`}
      isChecked={isOrgAdmin}
      isDisabled={isDisabled || isLoading}
      onChange={(_, checked) => onToggle(checked)}
      ouiaId={`OrgAdminToggle-${username}`}
    />
  );
};
