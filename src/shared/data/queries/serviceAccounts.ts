import { useQuery } from '@tanstack/react-query';
import { type ServiceAccount, fetchServiceAccounts } from '../api/serviceAccounts';
import { useAppServices } from '../../contexts/ServiceContext';

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
 * Auth token and SSO URL are resolved from useAppServices() (ServiceContext DI).
 *
 * @tag api-v1-external - Uses external SSO API
 */
export function useServiceAccountsQuery(params?: { page?: number; perPage?: number }, options?: { enabled?: boolean }) {
  const { axios, getToken, ssoUrl } = useAppServices();
  const { page = 1, perPage = 20 } = params ?? {};

  return useQuery({
    queryKey: serviceAccountsKeys.list({ page, perPage }),
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('Token is required to fetch service accounts');
      }
      return fetchServiceAccounts({ axios, page, perPage, token, ssoUrl });
    },
    enabled: (options?.enabled ?? true) && !!ssoUrl,
  });
}

// Re-export types
export type { ServiceAccount };
