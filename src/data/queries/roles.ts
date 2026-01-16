import { type UseQueryResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import {
  type ListRolesParams,
  type RoleIn,
  type RoleOutDynamic,
  type RolePaginationDynamic,
  type RolePatch,
  type RolePut,
  rolesApi,
} from '../api/roles';
import messages from '../../Messages';

// ============================================================================
// Response Types
// ============================================================================

/**
 * Roles list response type.
 */
export type RolesListResponse = RolePaginationDynamic;

/**
 * Single role type with optional V2 binding fields (gap:guessed-v2-api).
 */
export interface Role extends RoleOutDynamic {
  userGroup?: string;
  userGroupId?: string;
  workspace?: string;
  workspaceId?: string;
}

// ============================================================================
// Query Keys Factory
// ============================================================================

export const rolesKeys = {
  all: ['roles'] as const,
  lists: () => [...rolesKeys.all, 'list'] as const,
  list: (params: ListRolesParams) => [...rolesKeys.lists(), params] as const,
  details: () => [...rolesKeys.all, 'detail'] as const,
  detail: (id: string) => [...rolesKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch a paginated list of roles.
 * Accepts full API params for maximum flexibility.
 * Returns typed RolesListResponse with proper data/meta structure.
 */
export function useRolesQuery(params: ListRolesParams, options?: { enabled?: boolean }): UseQueryResult<RolesListResponse> {
  return useQuery({
    queryKey: rolesKeys.list(params),
    queryFn: async (): Promise<RolesListResponse> => {
      const response = await rolesApi.listRoles(params);
      return response.data as RolesListResponse;
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch a single role by ID.
 */
export function useRoleQuery(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: rolesKeys.detail(id),
    queryFn: async () => {
      const response = await rolesApi.getRole({ uuid: id });
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!id,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new role.
 * Note: No success notification - matches original Redux behavior.
 */
export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async (roleIn: RoleIn) => {
      const response = await rolesApi.createRole({ roleIn });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
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

interface UpdateRoleMutationParams {
  uuid: string;
  rolePut: RolePut;
}

/**
 * Update an existing role.
 */
export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: ({ uuid, rolePut }: UpdateRoleMutationParams) => rolesApi.updateRole({ uuid, rolePut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
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
 * Delete a role.
 */
export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: (uuid: string) => rolesApi.deleteRole({ uuid }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
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

interface PatchRoleMutationParams {
  uuid: string;
  rolePatch: RolePatch;
}

/**
 * Patch (partial update) a role - used for name/description edits.
 */
export function usePatchRoleMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ uuid, rolePatch }: PatchRoleMutationParams) => {
      const response = await rolesApi.patchRole({ uuid, rolePatch });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
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

// Re-export types (Role already defined locally, extending RoleOutDynamic)
export type { ListRolesParams, RoleIn, RolePut, RolePatch } from '../api/roles';
export type { RolePaginationDynamic, RoleWithAccess, Access, AdditionalGroup, RoleOutDynamic, ResourceDefinition } from '../api/roles';
