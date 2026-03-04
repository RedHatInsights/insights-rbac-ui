import { useQuery } from '@tanstack/react-query';
import { type ServiceAccount, fetchServiceAccounts } from '../api/serviceAccounts';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import { usePlatformEnvironment } from '../../hooks/usePlatformEnvironment';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const serviceAccountsKeys = {
  all: ['serviceAccounts'] as const,
  lists: () => [...serviceAccountsKeys.all, 'list'] as const,
  list: (params: { page?: number; perPage?: number }) => [...serviceAccountsKeys.lists(), params] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch service accounts from the SSO API.
 *
 * Auth is resolved internally: token is fetched fresh inside queryFn via
 * usePlatformAuth, and ssoUrl comes from usePlatformEnvironment.
 *
 * @tag api-v1-external - Uses external SSO API
 */
export function useServiceAccountsQuery(params?: { page?: number; perPage?: number }, options?: { enabled?: boolean }) {
  const { getToken } = usePlatformAuth();
  const { ssoUrl } = usePlatformEnvironment();
  const { page = 1, perPage = 20 } = params ?? {};

  return useQuery({
    queryKey: serviceAccountsKeys.list({ page, perPage }),
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('Token is required to fetch service accounts');
      }
      return fetchServiceAccounts({ page, perPage, token, ssoUrl });
    },
    enabled: (options?.enabled ?? true) && !!ssoUrl,
  });
}

// Re-export types
export type { ServiceAccount };
