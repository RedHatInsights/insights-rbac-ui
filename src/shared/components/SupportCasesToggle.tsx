import React from 'react';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { PORTAL_MANAGE_CASES, useAccountUserDetailQuery, useToggleManageSupportCasesMutation } from '../data/queries/users';

interface SupportCasesToggleProps {
  userId: string | undefined;
  username: string;
  isDisabled?: boolean;
  isActive?: boolean;
  /** Bulk permissions fetch in progress — show a spinner. */
  isPermissionsLoading?: boolean;
  /** Bulk permissions fetch failed — disable the toggle. */
  isPermissionsError?: boolean;
}

/**
 * Toggle switch for managing the `portal_manage_cases` permission.
 * Reads the permission cache-only (the list page bulk-fetches it via `useAccountUsersPermissionsQuery`);
 * toggling is a read-modify-write POST against the same cache entry.
 *
 * Hidden in ITLess environments (caller is responsible for not rendering).
 * Disabled when the viewer is not an org admin, or the target user is inactive.
 */
export const SupportCasesToggle: React.FC<SupportCasesToggleProps> = ({
  userId,
  username,
  isDisabled = false,
  isActive = true,
  isPermissionsLoading = false,
  isPermissionsError = false,
}) => {
  const { data: accountDetail } = useAccountUserDetailQuery(userId, { enabled: false });
  const toggleMutation = useToggleManageSupportCasesMutation();

  const hasPermission = accountDetail?.permissions?.includes(PORTAL_MANAGE_CASES) ?? false;

  // Disable unless we have the account detail to read from: the toggle is a read-modify-write
  // against the cached permissions array, so acting without it (bulk fetch errored, or no data
  // yet) would POST an array built from an empty base and clobber the user's real permissions.
  const isToggleDisabled = isDisabled || !isActive || !userId || isPermissionsError || !accountDetail || toggleMutation.isPending;

  const handleChange = (_event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    if (isToggleDisabled) return;
    if (checked === hasPermission) return;

    // Fire-and-forget: onError handles rollback + toast. Using mutate (not mutateAsync)
    // avoids an unhandled promise rejection escaping the event handler on failure.
    toggleMutation.mutate({ userId, grant: checked });
  };

  if (isPermissionsLoading) {
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
