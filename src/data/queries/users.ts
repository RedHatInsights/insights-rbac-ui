import { type UseQueryResult, useMutation, useQuery } from '@tanstack/react-query';
import { type ListPrincipalsParams, type PrincipalPagination, createUsersApi } from '../api/users';
import { useAppServices } from '../../contexts/ServiceContext';
import { isITLessProd, isInt, isStage } from '../../itLessConfig';
import { useMutationQueryClient } from './utils';
import { type MutationOptions, type QueryOptions } from './types';
import type { Environment } from '../../hooks/usePlatformEnvironment';

// ============================================================================
// Environment URL Helpers
// ============================================================================

interface EnvConfig {
  int: string;
  stage: string;
  prod: string;
}

/**
 * Get the base URL from environment config.
 * Returns empty string if no matching environment - this is the expected behavior in tests.
 */
function getBaseUrl(url: EnvConfig | undefined): string {
  if (!url) return '';
  if (isInt) return url.int;
  if (isStage) return url.stage;
  if (isITLessProd) return url.prod;
  return '';
}

/**
 * Fetch the environment-specific base URL from env.json.
 * Returns empty string if fetch fails (expected in tests).
 */
async function fetchEnvBaseUrl(): Promise<string> {
  try {
    const response = await fetch('/apps/rbac/env.json');
    const jsonData = (await response.json()) as EnvConfig;
    return getBaseUrl(jsonData);
  } catch {
    return '';
  }
}

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
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useUsersQuery(params: UseUsersQueryParams = {}, options?: QueryOptions): UseQueryResult<UsersQueryResult> {
  const { axios } = useAppServices();
  const usersApi = createUsersApi(axios);

  return useQuery(
    {
      queryKey: usersKeys.list(params as unknown as ListPrincipalsParams),
      queryFn: async (): Promise<UsersQueryResult> => {
        // Extract sort direction from orderBy prefix (e.g., '-username' -> desc)
        // Fetch users with pagination and filtering
        const sortOrder = params.orderBy?.startsWith('-') ? 'desc' : 'asc';
        const orderByField = params.orderBy?.replace(/^-/, '') as ListPrincipalsParams['orderBy'];

        const response = await usersApi.listPrincipals({
          limit: params.limit ?? 20,
          offset: params.offset ?? 0,
          orderBy: orderByField,
          usernameOnly: false,
          matchCriteria: 'partial',
          usernames: params.username,
          email: params.email,
          status: params.status,
          adminOnly: params.adminOnly,
          sortOrder: params.sortOrder ?? sortOrder,
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
    },
    options?.queryClient,
  );
}

// ============================================================================
// Helper Functions (for external IT API)
// ============================================================================

/**
 * Get the IT API base URL based on environment.
 */
function getITApiUrl(environment: Environment): string {
  return environment === 'production' ? 'https://api.access.redhat.com' : 'https://api.access.stage.redhat.com';
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
    environment: Environment;
    token: string | null;
    accountId?: string | number | null; // Handle both string and number since different components use different sources
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
export function useChangeUserStatusMutation(options?: MutationOptions) {
  const queryClient = useMutationQueryClient(options?.queryClient);

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
            const url = `${getITApiUrl(config.environment)}/account/v1/accounts/${config.accountId}/users/${user.id}/status`;
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

      // ITLess fallback - use dynamic base URL from env.json
      // In tests, env.json doesn't exist, so baseUrl is empty string -> '/change-users-status'
      const envUrl = await fetchEnvBaseUrl();
      return fetch(`${envUrl}/change-users-status`, {
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

// ============================================================================
// Update User Org Admin Status Mutation
// ============================================================================

interface UpdateUserOrgAdminParams {
  userId: string;
  isOrgAdmin: boolean;
  config: {
    environment: Environment;
    token: string | null;
    accountId: string | null;
  };
  itless?: boolean;
}

/**
 * Update user's org admin status.
 * Uses external IT API for org admin role management.
 *
 * IMPORTANT: The `config.token` must be obtained using `useChrome().auth.getToken()`
 * at the component level before calling this mutation.
 *
 * @tag api-v1-external - Uses external IT identity provider API
 */
export function useUpdateUserOrgAdminMutation(options?: MutationOptions) {
  const queryClient = useMutationQueryClient(options?.queryClient);

  return useMutation({
    mutationFn: async ({ userId, isOrgAdmin, config, itless }: UpdateUserOrgAdminParams) => {
      if (!config.token) {
        throw new Error('Token is required. Obtain it using useChrome().auth.getToken() before calling this mutation.');
      }

      if (config.accountId && !itless) {
        // External IT API for org admin role management
        const url = `${getITApiUrl(config.environment)}/account/v1/accounts/${config.accountId}/users/${userId}/roles`;
        return fetch(url, {
          method: isOrgAdmin ? 'POST' : 'DELETE',
          body: JSON.stringify({
            role: 'organization_administrator',
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.token}`,
          },
        });
      }

      // ITLess fallback - use RBAC admin endpoint
      const baseUrl = '/api/rbac/v1/admin';
      return fetch(`${baseUrl}/update-user-roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          is_org_admin: isOrgAdmin,
        }),
      });
    },
    onSuccess: () => {
      // Invalidate users queries to refetch updated status
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

// ============================================================================
// Invite Users Mutation
// ============================================================================

interface InviteUsersParams {
  emails: string[];
  isAdmin?: boolean;
  message?: string;
  portal_manage_cases?: boolean;
  portal_download?: boolean;
  portal_manage_subscriptions?: string;
  config: {
    environment: Environment;
    token: string | null;
    accountId: string | null;
  };
  itless?: boolean;
}

/**
 * Invite users via email.
 * Uses external IT API for user invitation.
 *
 * IMPORTANT: The `config.token` must be obtained using `useChrome().auth.getToken()`
 * at the component level before calling this mutation.
 *
 * @tag api-v1-external - Uses external IT identity provider API
 */
export function useInviteUsersMutation(options?: MutationOptions) {
  const queryClient = useMutationQueryClient(options?.queryClient);

  return useMutation({
    mutationFn: async ({
      emails,
      isAdmin,
      message,
      portal_manage_cases,
      portal_download,
      portal_manage_subscriptions,
      config,
      itless,
    }: InviteUsersParams) => {
      if (!config.token) {
        throw new Error('Token is required. Obtain it using useChrome().auth.getToken() before calling this mutation.');
      }

      if (config.accountId && !itless) {
        // External IT API for user invitation
        const url = `${getITApiUrl(config.environment)}/account/v1/accounts/${config.accountId}/users/invite`;
        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({
            emails,
            localeCode: 'en',
            ...(message && { message }),
            ...(isAdmin && { roles: ['organization_administrator'] }),
            ...(portal_manage_cases !== undefined && { portal_manage_cases }),
            ...(portal_download !== undefined && { portal_download }),
            ...(portal_manage_subscriptions && { portal_manage_subscriptions }),
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.token}`,
          },
        });

        return response; // Return raw response for status checking
      }

      // ITLess fallback - use dynamic base URL from env.json
      // In tests, env.json doesn't exist, so baseUrl is empty string -> '/user/invite'
      const envUrl = await fetchEnvBaseUrl();
      const response = await fetch(`${envUrl}/user/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify({
          emails,
          isAdmin,
          message,
        }),
      });

      return response; // Return raw response for status checking
    },
    onSuccess: () => {
      // Invalidate users queries to refetch updated list
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

// Re-export types (User already exported above)
export type { ListPrincipalsParams, Principal, PrincipalPagination } from '../api/users';
