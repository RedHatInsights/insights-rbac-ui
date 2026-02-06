/**
 * V2 Roles React Query Hooks - Temporary
 *
 * These hooks provide React Query wrappers for the V2 Roles API.
 * They use temporary types and will be updated when V2 APIs are delivered.
 *
 * @see Meeting notes: "RBAC v2 specs review with team by Sneha"
 * @tag api-v2-temporary
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { apiClient } from '../api/client';
import type { CreateRoleV2Request, ListRolesV2Params, RoleV2, RolesV2Pagination, UpdateRoleV2Request } from '../api/rolesV2';
import type { Access, RoleOutDynamic } from '../api/roles';
import messages from '../../Messages';
import { useMutationQueryClient } from './utils';
import { type MutationOptions } from './types';

// =============================================================================
// Query Keys Factory
// =============================================================================

export const rolesV2Keys = {
  all: ['roles-v2'] as const,
  lists: () => [...rolesV2Keys.all, 'list'] as const,
  list: (params: ListRolesV2Params) => [...rolesV2Keys.lists(), params] as const,
  details: () => [...rolesV2Keys.all, 'detail'] as const,
  detail: (id: string) => [...rolesV2Keys.details(), id] as const,
  assignments: (id: string) => [...rolesV2Keys.detail(id), 'assignments'] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch V2 roles list.
 * Uses V2 API when available, falls back to V1 for now.
 *
 * @tag api-v2-temporary - Will switch to V2 endpoint when delivered
 */
export function useRolesV2Query(params: ListRolesV2Params = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: rolesV2Keys.list(params),
    queryFn: async (): Promise<RolesV2Pagination> => {
      // TODO: Switch to V2 endpoint when available
      // const response = await apiClient.get('/api/rbac/v2/roles/', { params });
      // For now, use V1 endpoint with type adaptation
      const response = await apiClient.get('/api/rbac/v1/roles/', {
        params: {
          limit: params.limit ?? 20,
          offset: params.offset ?? 0,
          name: params.name,
          order_by: params.orderBy,
        },
      });

      // Adapt V1 response to V2 format
      return {
        data: response.data.data.map((role: RoleOutDynamic) => ({
          uuid: role.uuid,
          name: role.name,
          description: role.description,
          permissions: role.accessCount ?? null,
          modified: role.modified,
          system: role.system,
        })),
        meta: response.data.meta,
      };
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch single V2 role by ID.
 *
 * @tag api-v2-temporary - Will switch to V2 endpoint when delivered
 */
export function useRoleV2Query(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: rolesV2Keys.detail(id),
    queryFn: async (): Promise<RoleV2> => {
      // TODO: Switch to V2 endpoint when available
      const response = await apiClient.get(`/api/rbac/v1/roles/${id}/`);
      const role = response.data;

      return {
        uuid: role.uuid,
        name: role.name,
        description: role.description,
        permissions: role.access?.length ?? null,
        modified: role.modified,
        system: role.system,
        access: role.access?.map((a: Access) => ({
          application: a.permission?.split(':')[0] || '',
          resourceType: a.permission?.split(':')[1] || '',
          operation: a.permission?.split(':')[2] || '',
        })),
      };
    },
    enabled: (options?.enabled ?? true) && !!id,
  });
}

/**
 * Fetch role bindings for a workspace (roles assigned in this workspace).
 * Lists all subjects (groups) that have roles assigned in the specified workspace.
 *
 * @param workspaceId - The workspace resource ID
 * @param options - Query options
 * @tag api-v2-temporary - Uses role bindings by-subject API
 */
export function useRoleAssignmentsQuery(
  workspaceId: string,
  options?: {
    enabled?: boolean;
    limit?: number;
    cursor?: string;
    parentRoleBindings?: boolean;
  },
) {
  return useQuery({
    queryKey: [...rolesV2Keys.all, 'workspace-role-bindings', workspaceId, options?.limit, options?.cursor, options?.parentRoleBindings],
    queryFn: async () => {
      // Include inherited_from field when fetching parent role bindings
      const fields = options?.parentRoleBindings
        ? 'last_modified,subject(id,group.name,group.description,group.user_count),role(id,name),resource(id,name,type),inherited_from(name,type)'
        : 'last_modified,subject(id,group.name,group.description,group.user_count),role(id,name),resource(id,name,type)';

      const response = await apiClient.get('/api/rbac/v2/role-bindings/by-subject/', {
        params: {
          resource_id: workspaceId,
          resource_type: 'workspace',
          subject_type: 'group',
          limit: options?.limit ?? 10,
          cursor: options?.cursor,
          parent_role_bindings: options?.parentRoleBindings ?? false,
          fields,
        },
      });
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!workspaceId,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new V2 role.
 * Returns the created role object (per Riccardo's request).
 *
 * @tag api-v2-temporary - Will use V2 POST when available
 */
export function useCreateRoleV2Mutation(options?: MutationOptions) {
  const queryClient = useMutationQueryClient(options?.queryClient);
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async (data: CreateRoleV2Request): Promise<RoleV2> => {
      // TODO: Switch to V2 endpoint when available
      // const response = await apiClient.post('/api/rbac/v2/roles/', data);
      // return response.data;

      // For now, use V1 API
      const response = await apiClient.post('/api/rbac/v1/roles/', {
        name: data.name,
        description: data.description,
        access: data.permissions.map((p) => ({ permission: p })),
      });

      return {
        uuid: response.data.uuid,
        name: response.data.name,
        description: response.data.description,
        permissions: data.permissions.length,
        modified: new Date().toISOString(),
        system: false,
      };
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
 * Returns the updated role object (per Riccardo's request).
 *
 * @tag api-v2-temporary - Will use V2 PUT when available
 */
export function useUpdateRoleV2Mutation(options?: MutationOptions) {
  const queryClient = useMutationQueryClient(options?.queryClient);
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async (data: UpdateRoleV2Request): Promise<RoleV2> => {
      // TODO: Switch to V2 endpoint when available
      const response = await apiClient.put(`/api/rbac/v1/roles/${data.uuid}/`, {
        name: data.name,
        description: data.description,
        access: data.permissions.map((p) => ({ permission: p })),
      });

      return {
        uuid: response.data.uuid,
        name: response.data.name,
        description: response.data.description,
        permissions: data.permissions.length,
        modified: new Date().toISOString(),
        system: false,
      };
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
 * Delete a V2 role.
 *
 * @tag api-v2-temporary - Will use V2 DELETE when available
 */
export function useDeleteRoleV2Mutation(options?: MutationOptions) {
  const queryClient = useMutationQueryClient(options?.queryClient);
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async (uuid: string) => {
      await apiClient.delete(`/api/rbac/v1/roles/${uuid}/`);
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

// Re-export types
export type { RoleV2, RolesV2Pagination, ListRolesV2Params, CreateRoleV2Request, UpdateRoleV2Request } from '../api/rolesV2';
