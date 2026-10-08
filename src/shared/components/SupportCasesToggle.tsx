import React from 'react';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { PORTAL_MANAGE_CASES, useAccountUserDetailQuery, useToggleManageSupportCasesMutation } from '../data/queries/users';

interface SupportCasesToggleProps {
  userId: string | undefined;
  username: string;
  isDisabled?: boolean;
  isActive?: boolean;
}

/**
 * Toggle switch for managing the `portal_manage_cases` permission.
 * Fetches the current permission state from the account API and
 * toggles it via POST on change.
 *
 * Hidden in ITLess environments (caller is responsible for not rendering).
 * Disabled when the viewer is not an org admin, or the target user is inactive.
 */
export const SupportCasesToggle: React.FC<SupportCasesToggleProps> = ({ userId, username, isDisabled = false, isActive = true }) => {
  const { data: accountDetail, isLoading: isQueryLoading, isError } = useAccountUserDetailQuery(userId);
  const toggleMutation = useToggleManageSupportCasesMutation();

  const hasPermission = accountDetail?.permissions?.includes(PORTAL_MANAGE_CASES) ?? false;

  // Disable unless we have the account detail to read from: the toggle is a read-modify-write
  // against the cached permissions array, so acting without it (query errored, or no data yet)
  // would POST an array built from an empty base and clobber the user's real permissions.
  const isToggleDisabled = isDisabled || !isActive || !userId || isError || !accountDetail || toggleMutation.isPending;

  const handleChange = (_event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    if (isToggleDisabled) return;
    if (checked === hasPermission) return;

    // Fire-and-forget: onError handles rollback + toast. Using mutate (not mutateAsync)
    // avoids an unhandled promise rejection escaping the event handler on failure.
    toggleMutation.mutate({ userId, grant: checked });
  };

  if (isQueryLoading) {
    return <Spinner size="md" aria-label={`Loading support cases permission for ${username}`} />;
  }

  return (
    <Switch
      id={`support-cases-toggle-${username}`}
      aria-label={`Toggle manage support cases for ${username}`}
      isChecked={hasPermission}
      isDisabled={isToggleDisabled}
      onChange={handleChange}
    />
  );
};
