import { type UseQueryResult, useMutation, useQuery } from '@tanstack/react-query';
import { type ListPrincipalsParams, type PrincipalPagination, createUsersApi } from '../api/users';
import { useAppServices } from '../../contexts/ServiceContext';
import type { Environment } from '../../services/types';
import { isITLessProd, isInt, isStage } from '../../../itLessConfig';
import { useMutationQueryClient } from '../utils';
import { type MutationOptions, type QueryOptions } from '../types';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

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
        const users = (data?.data ?? []).map((principal) => {
          const p = principal as (typeof data.data)[number];
          return {
            username: p.username,
            email: 'email' in p ? (p.email as string) : '',
            first_name: 'first_name' in p ? p.first_name : undefined,
            last_name: 'last_name' in p ? p.last_name : undefined,
            is_active: 'is_active' in p ? p.is_active : undefined,
            is_org_admin: 'is_org_admin' in p ? p.is_org_admin : undefined,
            external_source_id: 'external_source_id' in p ? p.external_source_id : undefined,
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
}

/**
 * Change user status (activate/deactivate).
 * Uses the external IT API (or ITLess RBAC fallback).
 * Auth, environment, and notifications are handled internally.
 *
 * @tag api-v1-external - Uses external IT identity provider API
 */
export function useChangeUserStatusMutation(options?: MutationOptions) {
  const queryClient = useMutationQueryClient(options?.queryClient);
  const { notify, getToken, environment, identity, isITLess } = useAppServices();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ users }: ChangeUserStatusParams) => {
      const token = await getToken();
      const accountId = identity?.org_id ?? null;

      if (accountId && !isITLess) {
        const responses = await Promise.all(
          users.map((user) => {
            const url = `${getITApiUrl(environment)}/account/v1/accounts/${accountId}/users/${user.id}/status`;
            return fetch(url, {
              method: 'POST',
              body: JSON.stringify({
                status: user.is_active ? 'enabled' : 'disabled',
              }),
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });
          }),
        );
        const failed = responses.find((r) => !r.ok);
        if (failed) throw new Error(`Status change failed: ${failed.status}`);
        return responses;
      }

      // ITLess fallback - use dynamic base URL from env.json
      // In tests, env.json doesn't exist, so baseUrl is empty string -> '/change-users-status'
      const envUrl = await fetchEnvBaseUrl();
      const response = await fetch(`${envUrl}/change-users-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ users }),
      });
      if (!response.ok) throw new Error(`Status change failed: ${response.status}`);
      return response;
    },
    onMutate: async ({ users: mutatedUsers }) => {
      await queryClient.cancelQueries({ queryKey: usersKeys.lists() });

      const previousQueries = queryClient.getQueriesData<UsersQueryResult>({
        queryKey: usersKeys.lists(),
      });

      const usernameToStatus = new Map(mutatedUsers.map((u) => [u.username, u.is_active]));

      for (const [key, data] of previousQueries) {
        if (!data) continue;
        queryClient.setQueryData(key, {
          ...data,
          users: data.users.map((u) => (usernameToStatus.has(u.username) ? { ...u, is_active: usernameToStatus.get(u.username) } : u)),
        });
      }

      return { previousQueries };
    },
    onSuccess: () => {
      notify('success', intl.formatMessage(messages.editUserSuccessTitle), intl.formatMessage(messages.editUserSuccessDescription));
    },
    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      notify('danger', intl.formatMessage(messages.editUserErrorTitle), intl.formatMessage(messages.editUserErrorDescription));
    },
    onSettled: () => {
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
}

/**
 * Update user's org admin status.
 * Uses external IT API (or ITLess RBAC fallback).
 * Auth, environment, and notifications are handled internally.
 *
 * @tag api-v1-external - Uses external IT identity provider API
 */
export function useUpdateUserOrgAdminMutation(options?: MutationOptions) {
  const queryClient = useMutationQueryClient(options?.queryClient);
  const { notify, getToken, environment, identity, isITLess } = useAppServices();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ userId, isOrgAdmin }: UpdateUserOrgAdminParams) => {
      const token = await getToken();
      const accountId = identity?.org_id ?? null;

      if (accountId && !isITLess) {
        // External IT API for org admin role management
        const url = `${getITApiUrl(environment)}/account/v1/accounts/${accountId}/users/${userId}/roles`;
        return fetch(url, {
          method: isOrgAdmin ? 'POST' : 'DELETE',
          body: JSON.stringify({
            role: 'organization_administrator',
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // ITLess fallback - use RBAC admin endpoint
      const baseUrl = '/api/rbac/v1/admin';
      return fetch(`${baseUrl}/update-user-roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          is_org_admin: isOrgAdmin,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      notify('success', intl.formatMessage(messages.editUserSuccessTitle), intl.formatMessage(messages.editUserSuccessDescription));
    },
    onError: () => {
      notify('danger', intl.formatMessage(messages.editUserErrorTitle), intl.formatMessage(messages.editUserErrorDescription));
    },
  });
}

// ============================================================================
// Invite Users Mutation
// ============================================================================

export interface InviteUsersParams {
  emails: string[];
  isAdmin?: boolean;
  portal_manage_cases?: boolean;
  portal_download?: boolean;
  portal_manage_subscriptions?: string;
}

/**
 * Invite users via email.
 * Auth, environment, identity, and ITLess flag are resolved from useAppServices().
 *
 * @tag api-v1-external - Uses external IT identity provider API
 */
export function useInviteUsersMutation(options?: MutationOptions) {
  const queryClient = useMutationQueryClient(options?.queryClient);
  const { getToken, environment, identity, isITLess } = useAppServices();

  return useMutation({
    mutationFn: async ({ emails, isAdmin, portal_manage_cases, portal_download, portal_manage_subscriptions }: InviteUsersParams) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Auth token is required for invite users mutation.');
      }

      const accountId = identity?.org_id ?? null;

      if (accountId && !isITLess) {
        const url = `${getITApiUrl(environment)}/account/v1/accounts/${accountId}/users/invite`;
        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({
            emails,
            localeCode: 'en',
            ...(isAdmin && { roles: ['organization_administrator'] }),
            ...(portal_manage_cases !== undefined && { portal_manage_cases }),
            ...(portal_download !== undefined && { portal_download }),
            ...(portal_manage_subscriptions && { portal_manage_subscriptions }),
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        return response;
      }

      const envUrl = await fetchEnvBaseUrl();
      const response = await fetch(`${envUrl}/user/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          emails,
          isAdmin,
        }),
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

// Re-export types (User already exported above)
export type { ListPrincipalsParams, Principal, PrincipalPagination } from '../api/users';
