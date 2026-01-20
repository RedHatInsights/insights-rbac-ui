import { useQuery } from '@tanstack/react-query';
import { type ServiceAccount, type ServiceAccountsQueryParams, fetchServiceAccounts } from '../api/serviceAccounts';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const serviceAccountsKeys = {
  all: ['serviceAccounts'] as const,
  lists: () => [...serviceAccountsKeys.all, 'list'] as const,
  list: (params: Partial<ServiceAccountsQueryParams>) => [...serviceAccountsKeys.lists(), params] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export interface UseServiceAccountsQueryParams {
  page?: number;
  perPage?: number;
  token: string | null;
  ssoUrl: string;
}

/**
 * Fetch service accounts from the SSO API.
 *
 * @tag api-v1-external - Uses external SSO API
 */
export function useServiceAccountsQuery(params: UseServiceAccountsQueryParams, options?: { enabled?: boolean }) {
  const { token, ssoUrl, page = 1, perPage = 20 } = params;

  return useQuery({
    queryKey: serviceAccountsKeys.list({ page, perPage }),
    queryFn: async () => {
      if (!token) {
        throw new Error('Token is required to fetch service accounts');
      }
      return fetchServiceAccounts({ page, perPage, token, ssoUrl });
    },
    enabled: (options?.enabled ?? true) && !!token && !!ssoUrl,
  });
}

// Re-export types
export type { ServiceAccount };
