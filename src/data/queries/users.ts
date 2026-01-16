import { type UseQueryResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ListPrincipalsParams, type PrincipalPagination, usersApi } from '../api/users';

// ============================================================================
// Response Types
// ============================================================================

/**
 * User type for use in components.
 * Re-export from API layer for consistency.
 */
export { type User } from '../api/users';

/**
 * Users query result - unwrapped and typed.
 */
export interface UsersQueryResult {
  users: Array<{
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    is_active?: boolean;
    is_org_admin?: boolean;
    external_source_id?: number | string;
    user_groups_count?: number;
  }>;
  totalCount: number;
}

// ============================================================================
// Query Keys Factory
// ============================================================================

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params: ListPrincipalsParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (username: string) => [...usersKeys.details(), username] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export interface UseUsersQueryParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  username?: string;
  email?: string;
  status?: 'enabled' | 'disabled' | 'all';
  adminOnly?: boolean;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Fetch a paginated list of users/principals.
 * Returns unwrapped, typed users array and total count.
 */
export function useUsersQuery(params: UseUsersQueryParams = {}, options?: { enabled?: boolean }): UseQueryResult<UsersQueryResult> {
  return useQuery({
    queryKey: usersKeys.list(params as unknown as ListPrincipalsParams),
    queryFn: async (): Promise<UsersQueryResult> => {
      const response = await usersApi.listPrincipals({
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
        orderBy: params.orderBy as ListPrincipalsParams['orderBy'],
        usernameOnly: false,
        matchCriteria: 'partial',
        usernames: params.username,
        email: params.email,
        status: params.status,
        adminOnly: params.adminOnly,
        sortOrder: params.sortOrder,
      });
      const data = response.data as PrincipalPagination;

      // Transform API response to clean typed structure
      // Use type assertion for fields that might be in the response but not in the strict type
      type PrincipalWithExtras = (typeof data.data)[number] & {
        user_groups_count?: number;
      };
      const users = (data?.data ?? []).map((principal) => {
        const p = principal as PrincipalWithExtras;
        return {
          username: p.username,
          email: 'email' in p ? (p.email as string) : '',
          first_name: 'first_name' in p ? p.first_name : undefined,
          last_name: 'last_name' in p ? p.last_name : undefined,
          is_active: 'is_active' in p ? p.is_active : undefined,
          is_org_admin: 'is_org_admin' in p ? p.is_org_admin : undefined,
          external_source_id: 'external_source_id' in p ? p.external_source_id : undefined,
          user_groups_count: p.user_groups_count,
        };
      });

      return {
        users,
        totalCount: data?.meta?.count ?? users.length,
      };
    },
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// Helper Functions (for external IT API)
// ============================================================================

/**
 * Get the IT API base URL based on environment
 */
function getITApiUrl(isProd: boolean): string {
  return isProd ? 'https://api.access.redhat.com/management' : 'https://api.access.stage.redhat.com/management';
}

// ============================================================================
// Mutation Hooks
// ============================================================================

interface ChangeUserStatusParams {
  users: Array<{
    id: string | number | undefined;
    username: string;
    is_active: boolean;
  }>;
  config: {
    isProd: boolean;
    token: string | null;
    accountId: number | undefined;
  };
  itless?: boolean;
}

/**
 * Change user status (activate/deactivate).
 * This uses the external IT API, not the RBAC API.
 *
 * IMPORTANT: The `config.token` must be obtained using `useChrome().auth.getToken()`
 * at the component level before calling this mutation. Never use `window.insights` directly.
 *
 * @tag api-v1-external - Uses external IT identity provider API
 */
export function useChangeUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ users, config, itless }: ChangeUserStatusParams) => {
      // Token must always be provided via config (obtained from useChrome hook)
      if (!config.token) {
        throw new Error('Token is required. Obtain it using useChrome().auth.getToken() before calling this mutation.');
      }

      if (config.accountId && !itless) {
        // External IT API for status change
        return Promise.all(
          users.map((user) => {
            const url = `${getITApiUrl(config.isProd)}/account/v1/accounts/${config.accountId}/users/${user.id}/status`;
            return fetch(url, {
              method: 'POST',
              body: JSON.stringify({
                status: user.is_active ? 'enabled' : 'disabled',
              }),
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.token}`,
              },
            });
          }),
        );
      }

      // ITLess fallback - use RBAC endpoint (token still obtained from useChrome)
      const baseUrl = '/api/rbac/v1/admin';
      return fetch(`${baseUrl}/change-users-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify({ users }),
      });
    },
    onSuccess: () => {
      // Invalidate users queries to refetch updated status
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

// Re-export types (User already exported above)
export type { ListPrincipalsParams, Principal, PrincipalPagination } from '../api/users';
