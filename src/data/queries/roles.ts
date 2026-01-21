import { type UseQueryResult, useMutation, useQuery } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import {
  GetRoleScopeEnum,
  type ListRolesParams,
  type RoleIn,
  type RoleOutDynamic,
  type RolePaginationDynamic,
  type RolePatch,
  type RolePut,
  type RoleWithAccess,
  createRolesApi,
} from '../api/roles';
import { useAppServices } from '../../contexts/ServiceContext';
import messages from '../../Messages';
import { useMutationQueryClient } from './utils';
import { type MutationOptions, type QueryOptions } from './types';

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
 *
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useRolesQuery(params: ListRolesParams, options?: QueryOptions): UseQueryResult<RolesListResponse> {
  const { axios } = useAppServices();
  const rolesApi = createRolesApi(axios);

  return useQuery(
    {
      queryKey: rolesKeys.list(params),
      queryFn: async () => {
        const response = await rolesApi.listRoles(params);
        return response.data;
      },
      enabled: options?.enabled ?? true,
    },
    options?.queryClient,
  );
}

/**
 * Fetch a single role by ID.
 *
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useRoleQuery(id: string, options?: QueryOptions) {
  const { axios } = useAppServices();
  const rolesApi = createRolesApi(axios);

  return useQuery(
    {
      queryKey: rolesKeys.detail(id),
      queryFn: async () => {
        const response = await rolesApi.getRole({ uuid: id });
        return response.data;
      },
      enabled: (options?.enabled ?? true) && !!id,
    },
    options?.queryClient,
  );
}

/**
 * Fetch a single role by ID with principal scope.
 * Used for getting role access/permissions for the current principal.
 * Returns RoleWithAccess which includes the access array with permissions.
 *
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useRoleForPrincipalQuery(id: string, options?: QueryOptions): UseQueryResult<RoleWithAccess> {
  const { axios } = useAppServices();
  const rolesApi = createRolesApi(axios);

  return useQuery(
    {
      queryKey: [...rolesKeys.detail(id), 'principal'] as const,
      queryFn: async () => {
        const response = await rolesApi.getRole({ uuid: id, scope: GetRoleScopeEnum.Principal });
        return response.data;
      },
      enabled: (options?.enabled ?? true) && !!id,
    },
    options?.queryClient,
  );
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new role.
 * Note: No success notification shown for this operation.
 *
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useCreateRoleMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const rolesApi = createRolesApi(axios);
  const intl = useIntl();
  const qc = useMutationQueryClient(options?.queryClient);

  return useMutation(
    {
      mutationFn: async (roleIn: RoleIn) => {
        const response = await rolesApi.createRole({ roleIn });
        return response.data;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: rolesKeys.all });
      },
      onError: () => {
        notify('danger', intl.formatMessage(messages.createRoleErrorTitle));
      },
    },
    options?.queryClient,
  );
}

interface UpdateRoleMutationParams {
  uuid: string;
  rolePut: RolePut;
}

/**
 * Update an existing role.
 *
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useUpdateRoleMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const rolesApi = createRolesApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: ({ uuid, rolePut }: UpdateRoleMutationParams) => rolesApi.updateRole({ uuid, rolePut }),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: rolesKeys.all });
        notify('success', intl.formatMessage(messages.editRoleSuccessTitle));
      },
      onError: () => {
        notify('danger', intl.formatMessage(messages.editRoleErrorTitle));
      },
    },
    options?.queryClient,
  );
}

/**
 * Delete a role.
 *
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useDeleteRoleMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const rolesApi = createRolesApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: (uuid: string) => rolesApi.deleteRole({ uuid }),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: rolesKeys.all });
        notify('success', intl.formatMessage(messages.removeRoleSuccessTitle));
      },
      onError: () => {
        notify('danger', intl.formatMessage(messages.removeRoleErrorTitle));
      },
    },
    options?.queryClient,
  );
}

interface PatchRoleMutationParams {
  uuid: string;
  rolePatch: RolePatch;
}

/**
 * Patch (partial update) a role - used for name/description edits.
 *
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function usePatchRoleMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const rolesApi = createRolesApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: async ({ uuid, rolePatch }: PatchRoleMutationParams) => {
        const response = await rolesApi.patchRole({ uuid, rolePatch });
        return response.data;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: rolesKeys.all });
        notify('success', intl.formatMessage(messages.editRoleSuccessTitle));
      },
      onError: () => {
        notify('danger', intl.formatMessage(messages.editRoleErrorTitle));
      },
    },
    options?.queryClient,
  );
}

// Re-export types (Role already defined locally, extending RoleOutDynamic)
export type { ListRolesParams, RoleIn, RolePut, RolePatch } from '../api/roles';
export type { RolePaginationDynamic, RoleWithAccess, Access, AdditionalGroup, RoleOutDynamic, ResourceDefinition } from '../api/roles';
