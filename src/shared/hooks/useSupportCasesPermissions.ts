import { useMemo } from 'react';
import { useAccountUsersPermissionsQuery } from '../data/queries/users';

interface SupportCasesUser {
  external_source_id?: number | string;
}

interface UseSupportCasesPermissionsResult {
  isLoading: boolean;
}

/**
 * Bulk-fetch support-cases permissions for a page of users in one request, seeding the cache
 * `SupportCasesToggle` reads. Single entry point: a page rendering the toggle must call this with
 * the column's `isCommonAuthModel && orgAdmin && !isITLess` gate, or the toggle stays disabled.
 */
export function useSupportCasesPermissions(
  users: ReadonlyArray<SupportCasesUser>,
  { enabled }: { enabled: boolean },
): UseSupportCasesPermissionsResult {
  const userIds = useMemo(
    () => (enabled ? users.map((u) => (u.external_source_id != null ? String(u.external_source_id) : undefined)) : []),
    [enabled, users],
  );

  const { isLoading } = useAccountUsersPermissionsQuery(userIds, { enabled });

  return { isLoading };
}
