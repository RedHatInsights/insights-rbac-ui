/**
 * V2 Roles React Query Hooks
 *
 * Wrappers for the V2 Roles API endpoints using @redhat-cloud-services/rbac-client.
 * Uses cursor-based pagination (CursorPaginationMeta + CursorPaginationLinks).
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { rolesV2Api } from '../api/rolesV2';
import type {
  CursorPaginationLinks,
  RolesBatchDeleteRolesRequest,
  RolesCreateOrUpdateRoleRequest,
  RolesList200Response,
  RolesListParams,
  RolesRole,
} from '../api/rolesV2';
import messages from '../../Messages';
import { useMutationQueryClient } from './utils';
import type { MutationOptions } from './types';

// =============================================================================
// Query Keys Factory
// =============================================================================

export const rolesV2Keys = {
  all: ['roles-v2'] as const,
  lists: () => [...rolesV2Keys.all, 'list'] as const,
  list: (params: RolesListParams) => [...rolesV2Keys.lists(), params] as const,
  details: () => [...rolesV2Keys.all, 'detail'] as const,
  detail: (id: string) => [...rolesV2Keys.details(), id] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch V2 roles list with cursor-based pagination.
 *
 * Response shape:
 * - data: RolesRole[]
 * - meta: { limit } (CursorPaginationMeta - no count)
 * - links: { next, previous } (CursorPaginationLinks)
 */
export function useRolesV2Query(params: RolesListParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: rolesV2Keys.list(params),
    queryFn: async (): Promise<RolesList200Response> => {
      const response = await rolesV2Api.rolesList(params);
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Helper to extract cursor pagination links from V2 roles response.
 */
export function extractRolesV2Links(data: RolesList200Response | undefined): CursorPaginationLinks | null {
  return data?.links ?? null;
}

/**
 * Fetch single V2 role by ID.
 */
export function useRoleV2Query(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: rolesV2Keys.detail(id),
    queryFn: async (): Promise<RolesRole> => {
      const response = await rolesV2Api.rolesRead({ id });
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!id,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new V2 role.
 */
export function useCreateRoleV2Mutation(options?: MutationOptions) {
  const queryClient = useMutationQueryClient(options?.queryClient);
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async (data: RolesCreateOrUpdateRoleRequest): Promise<RolesRole> => {
      const response = await rolesV2Api.rolesCreate({
        rolesCreateOrUpdateRoleRequest: data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesV2Keys.all });
      addNotification({
        variant: 'success',
        title: 'Role created successfully',
        dismissable: true,
      });
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.createRoleErrorTitle),
        dismissable: true,
      });
    },
  });
}

/**
 * Update a V2 role.
 */
export function useUpdateRoleV2Mutation(options?: MutationOptions) {
  const queryClient = useMutationQueryClient(options?.queryClient);
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ id, ...data }: RolesCreateOrUpdateRoleRequest & { id: string }): Promise<RolesRole> => {
      const response = await rolesV2Api.rolesUpdate({
        id,
        rolesCreateOrUpdateRoleRequest: data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesV2Keys.all });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.editRoleSuccessTitle),
        dismissable: true,
      });
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.editRoleErrorTitle),
        dismissable: true,
      });
    },
  });
}

/**
 * Batch delete V2 roles.
 */
export function useBatchDeleteRolesV2Mutation(options?: MutationOptions) {
  const queryClient = useMutationQueryClient(options?.queryClient);
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async (data: RolesBatchDeleteRolesRequest): Promise<void> => {
      await rolesV2Api.rolesBatchDelete({
        rolesBatchDeleteRolesRequest: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesV2Keys.all });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.removeRoleSuccessTitle),
        dismissable: true,
      });
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.removeRoleErrorTitle),
        dismissable: true,
      });
    },
  });
}

// Re-export types for consumer convenience
export type {
  RolesListParams,
  RolesList200Response,
  RolesRole,
  RolesPermission,
  RolesCreateOrUpdateRoleRequest,
  RolesBatchDeleteRolesRequest,
  CursorPaginationMeta,
  CursorPaginationLinks,
} from '../api/rolesV2';
