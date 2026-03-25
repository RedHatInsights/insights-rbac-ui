/**
 * V2 Roles React Query Hooks
 *
 * Uses native V2 roles API with cursor-based pagination.
 * Name filtering uses glob patterns (backend-pending):
 * `name=*term*` for contains-search.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { createRolesV2Api } from '../api/roles';
import type {
  CursorPaginationLinks,
  ExcludeSources,
  Role,
  RoleBindingsListBySubject200Response,
  RoleBindingsRoleBinding,
  RolesBatchDeleteRolesRequest,
  RolesCreateOrUpdateRoleRequest,
  RolesList200Response,
  RolesListParams,
} from '../api/roles';

import { useAppServices } from '../../../shared/contexts/ServiceContext';
import messages from '../../../Messages';
import { useMutationQueryClient } from '../../../shared/data/utils';
import type { MutationOptions } from '../../../shared/data/types';
import { roleBindingsKeys } from './workspaces';

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
 * Extended query params — adds `username` which the rbac-client doesn't
 * expose yet.  Passed as an extra axios query param until the client ships
 * official support, at which point we remove the wrapper and it works
 * transparently.
 */
export interface RolesV2QueryParams extends RolesListParams {
  /** Filter roles by assigned username (extra param, not in rbac-client yet) */
  username?: string;
}

/**
 * Fetch V2 roles list with cursor-based pagination.
 *
 * Name filtering uses glob patterns (backend-pending):
 * - `name=foo` → exact match (works today)
 * - `name=foo*` → starts with "foo" (when backend ships glob support)
 * - `name=*foo*` → contains "foo" (when backend ships glob support)
 *
 * Until the backend implements glob support, non-exact patterns will
 * return no results. This is acceptable since V2 is behind a feature flag.
 */
export function useRolesV2Query(params: RolesV2QueryParams = {}, options?: { enabled?: boolean }) {
  const { axios } = useAppServices();
  const rolesApi = createRolesV2Api(axios);
  const { username, ...apiParams } = params;

  return useQuery({
    queryKey: rolesV2Keys.list(params as RolesListParams),
    queryFn: async (): Promise<RolesList200Response> => {
      const response = await rolesApi.rolesList({
        ...apiParams,
        ...(username ? { options: { params: { username } } } : {}),
      });
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch all V2 roles by walking cursor-paginated pages.
 * Useful for role pickers and wizards that need the full list.
 *
 * The V2 API ignores `limit=-1`, so we fetch pages sequentially
 * and accumulate until `links.next` is null.
 *
 * `resourceType` and `resourceId` filter roles to those assignable at a
 * specific resource level (workspace vs tenant).  These are passed as extra
 * Axios query params until the rbac-client ships first-class support.
 */
export function useAllRolesV2Query(options?: { enabled?: boolean; name?: string; resourceType?: string; resourceId?: string }) {
  const { axios } = useAppServices();
  const rolesApi = createRolesV2Api(axios);
  const extraParams: Record<string, string> = {};
  if (options?.resourceType) extraParams.resource_type = options.resourceType;
  if (options?.resourceId) extraParams.resource_id = options.resourceId;
  const hasExtra = Object.keys(extraParams).length > 0;

  return useQuery({
    queryKey: [...rolesV2Keys.lists(), 'all', options?.name, options?.resourceType, options?.resourceId] as const,
    queryFn: async (): Promise<Role[]> => {
      const allRoles: Role[] = [];
      let cursor: string | undefined;

      do {
        const response = await rolesApi.rolesList({
          limit: 100,
          fields: 'id,name,description,permissions_count,last_modified,org_id',
          ...(cursor && { cursor }),
          ...(options?.name && { name: options.name }),
          ...(hasExtra && { options: { params: extraParams } }),
        });
        const page = response.data;
        allRoles.push(...page.data);

        const nextUrl = page.links?.next;
        cursor = nextUrl ? extractCursor(nextUrl) : undefined;
      } while (cursor);

      return allRoles;
    },
    enabled: options?.enabled ?? true,
  });
}

function extractCursor(nextUrl: string): string | undefined {
  try {
    const url = new URL(nextUrl, 'https://placeholder');
    return url.searchParams.get('cursor') ?? undefined;
  } catch {
    return undefined;
  }
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
export function useRoleQuery(id: string, options?: { enabled?: boolean }) {
  const { axios } = useAppServices();
  const rolesApi = createRolesV2Api(axios);

  return useQuery({
    queryKey: rolesV2Keys.detail(id),
    queryFn: async (): Promise<Role> => {
      const response = await rolesApi.rolesRead({
        id,
        fields: 'id,name,description,permissions,permissions_count,last_modified',
      });
      return response.data;
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
 */
export function useRoleAssignmentsQuery(
  workspaceId: string,
  options?: {
    enabled?: boolean;
    limit?: number;
    cursor?: string;
    excludeSources?: ExcludeSources;
  },
) {
  const { axios } = useAppServices();
  const rolesApi = createRolesV2Api(axios);

  return useQuery({
    queryKey: [...roleBindingsKeys.all, 'workspace-role-bindings', workspaceId, options?.limit, options?.cursor, options?.excludeSources],
    queryFn: async (): Promise<RoleBindingsListBySubject200Response> => {
      const fields = 'last_modified,subject(id,group.name,group.description,group.user_count),roles(id,name),resource(id,name,type)';

      const response = await rolesApi.roleBindingsListBySubject({
        resourceId: workspaceId,
        resourceType: 'workspace',
        subjectType: 'group',
        limit: options?.limit ?? 10,
        cursor: options?.cursor,
        excludeSources: options?.excludeSources,
        fields,
      });
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!workspaceId,
  });
}

/**
 * Fetch where a specific role is used: which groups have it and in which workspaces.
 */
export function useRoleUsageQuery(roleId: string, options?: { enabled?: boolean }) {
  const { axios } = useAppServices();
  const rolesApi = createRolesV2Api(axios);

  return useQuery({
    queryKey: [...roleBindingsKeys.all, 'role-bindings', roleId],
    queryFn: async (): Promise<RoleBindingsRoleBinding[]> => {
      const response = await rolesApi.roleBindingsList({
        roleId,
        limit: 1000,
        fields: 'subject(id,group.name),resource(id,name,type)',
      });
      return response.data?.data ?? [];
    },
    enabled: (options?.enabled ?? true) && !!roleId,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new V2 role.
 */
export function useCreateRoleMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const rolesApi = createRolesV2Api(axios);
  const queryClient = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation({
    mutationFn: async (data: RolesCreateOrUpdateRoleRequest): Promise<Role> => {
      const response = await rolesApi.rolesCreate({
        rolesCreateOrUpdateRoleRequest: data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesV2Keys.all });
      notify('success', 'Role created successfully');
    },
    onError: () => {
      notify('danger', intl.formatMessage(messages.createRoleErrorTitle));
    },
  });
}

/**
 * Update a V2 role.
 */
export function useUpdateRoleMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const rolesApi = createRolesV2Api(axios);
  const queryClient = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ id, ...data }: RolesCreateOrUpdateRoleRequest & { id: string }): Promise<Role> => {
      const response = await rolesApi.rolesUpdate({
        id,
        rolesCreateOrUpdateRoleRequest: data,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesV2Keys.all });
      notify('success', intl.formatMessage(messages.editRoleSuccessTitle));
    },
    onError: () => {
      notify('danger', intl.formatMessage(messages.editRoleErrorTitle));
    },
  });
}

/**
 * Batch delete V2 roles.
 */
export function useBatchDeleteRolesV2Mutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const rolesApi = createRolesV2Api(axios);
  const queryClient = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation({
    mutationFn: async (data: RolesBatchDeleteRolesRequest): Promise<void> => {
      await rolesApi.rolesBatchDelete({
        rolesBatchDeleteRolesRequest: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesV2Keys.all });
      queryClient.invalidateQueries({ queryKey: roleBindingsKeys.all });
      notify('success', intl.formatMessage(messages.removeRoleSuccessTitle));
    },
    onError: () => {
      notify('danger', intl.formatMessage(messages.removeRoleErrorTitle));
    },
  });
}

// Re-export types for consumer convenience
export type {
  Role,
  RolesListParams,
  RolesList200Response,
  Permission,
  RolesCreateOrUpdateRoleRequest,
  RolesBatchDeleteRolesRequest,
  CursorPaginationMeta,
  CursorPaginationLinks,
} from '../api/roles';
