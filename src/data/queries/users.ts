import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ListPrincipalsParams, usersApi } from '../api/users';

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
 */
export function useUsersQuery(params: UseUsersQueryParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: usersKeys.list(params as unknown as ListPrincipalsParams),
    queryFn: async () => {
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
      return response.data;
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
 * @tag api-v1-external - Uses external IT identity provider API
 */
export function useChangeUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ users, config, itless }: ChangeUserStatusParams) => {
      if (config.accountId && config.token && !itless) {
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

      // ITLess fallback - use RBAC endpoint
      const token = (await (window as any).insights?.chrome?.auth?.getToken()) as string;
      const baseUrl = '/api/rbac/v1/admin';
      return fetch(`${baseUrl}/change-users-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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

// Re-export types
export type { User, ListPrincipalsParams, Principal, PrincipalPagination } from '../api/users';
