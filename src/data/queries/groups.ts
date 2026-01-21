import { type UseQueryResult, useMutation, useQuery } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import {
  type AddPrincipalToGroupParams,
  type GetPrincipalsFromGroupParams,
  type GroupOut,
  type GroupPagination,
  type GroupRolesPagination,
  type ListGroupsParams,
  type PrincipalPagination,
  createGroupsApi,
} from '../api/groups';
import { useAppServices } from '../../contexts/ServiceContext';
import messages from '../../Messages';
import { useMutationQueryClient } from './utils';
import { type MutationOptions, type QueryOptions } from './types';

// ============================================================================
// Response Types
// ============================================================================

/**
 * Standard paginated response wrapper for API responses.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    count: number;
    limit?: number;
    offset?: number;
  };
  links?: {
    first?: string;
    previous?: string;
    next?: string;
    last?: string;
  };
}

/**
 * Groups list response type.
 */
export type GroupsListResponse = GroupPagination;

/**
 * Group type for use in components.
 * Based on GroupOut with additional optional fields that may come from different API versions
 * and UI state properties for expanded row data.
 *
 * Note: We use Omit to override principalCount because the UI needs to support
 * "All" string for platform_default groups in addition to numeric counts.
 */
export interface Group extends Omit<GroupOut, 'principalCount'> {
  principalCount?: number | string;
  roleCount?: number;
  serviceAccountCount?: number;
  workspaceCount?: number;
  policyCount?: number;
  // UI state for expanded rows - populated when rows are expanded
  roles?: GroupRole[];
  members?: Member[];
  isLoadingRoles?: boolean;
  isLoadingMembers?: boolean;
}

/**
 * Member type for use in components.
 */
export interface Member {
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_active?: boolean;
  is_org_admin?: boolean;
}

/**
 * Members query result - unwrapped and typed.
 */
export interface MembersQueryResult {
  members: Member[];
  totalCount: number;
}

/**
 * Parameters for fetching members from a group.
 */
export interface UseGroupMembersQueryParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  username?: string; // Filter by username
}

/**
 * Role type for group roles (with optional V2 binding fields).
 */
export interface GroupRole {
  uuid: string;
  name: string;
  display_name?: string;
  description?: string;
  modified?: string;
  workspace?: string;
  workspaceId?: string;
}

/**
 * Group roles query result - unwrapped and typed.
 */
export interface GroupRolesQueryResult {
  roles: GroupRole[];
  totalCount: number;
}

/**
 * Service account type for group service accounts.
 * Note: Service accounts come from RBAC API's getPrincipalsFromGroup endpoint.
 * The time_created is normalized to milliseconds in the query layer.
 */
export interface ServiceAccount {
  uuid: string;
  clientId: string;
  name: string;
  owner?: string;
  description?: string;
  time_created?: number; // Unix timestamp in milliseconds (normalized from API's seconds)
}

/**
 * Raw service account response from the RBAC API (before normalization).
 * Used for typing MSW mock handlers in tests/stories.
 * Note: time_created is in Unix SECONDS; the query layer converts to milliseconds.
 */
export interface RawServiceAccountFromApi {
  username: string;
  clientId?: string;
  name?: string;
  owner?: string;
  description?: string;
  time_created?: number; // Unix timestamp in SECONDS (API format)
}

/**
 * Parameters for fetching service accounts from a group.
 */
export interface UseGroupServiceAccountsQueryParams {
  limit?: number;
  offset?: number;
  clientId?: string;
  name?: string;
  description?: string;
}

/**
 * Service accounts list response type.
 */
export interface ServiceAccountsListResponse {
  data: ServiceAccount[];
  meta: {
    count: number;
  };
}

// ============================================================================
// Query Keys Factory
// ============================================================================

export const groupsKeys = {
  all: ['groups'] as const,
  lists: () => [...groupsKeys.all, 'list'] as const,
  list: (params: ListGroupsParams) => [...groupsKeys.lists(), params] as const,
  adminGroup: () => [...groupsKeys.all, 'admin'] as const,
  systemGroup: () => [...groupsKeys.all, 'system'] as const,
  details: () => [...groupsKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupsKeys.details(), id] as const,
  members: (id: string) => [...groupsKeys.detail(id), 'members'] as const,
  roles: (id: string) => [...groupsKeys.detail(id), 'roles'] as const,
  serviceAccounts: (id: string) => [...groupsKeys.detail(id), 'service-accounts'] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export interface UseGroupsQueryParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  name?: string;
  system?: boolean;
  platformDefault?: boolean;
  adminDefault?: boolean;
  username?: string; // Filter groups by user membership (principalUsername)
  excludeUsername?: string; // Filter groups where principal is NOT a member
}

/**
 * Fetch a paginated list of groups.
 * Returns typed GroupsListResponse with proper data/meta structure.
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 */
export function useGroupsQuery(params: UseGroupsQueryParams = {}, options?: QueryOptions): UseQueryResult<GroupsListResponse> {
  const { axios } = useAppServices();
  const groupsApi = createGroupsApi(axios);

  return useQuery(
    {
      queryKey: groupsKeys.list(params as ListGroupsParams),
      queryFn: async (): Promise<GroupsListResponse> => {
        const response = await groupsApi.listGroups({
          limit: params.limit ?? 20,
          offset: params.offset ?? 0,
          orderBy: params.orderBy as ListGroupsParams['orderBy'],
          name: params.name,
          system: params.system,
          platformDefault: params.platformDefault,
          adminDefault: params.adminDefault,
          username: params.username,
          excludeUsername: params.excludeUsername,
        });
        return response.data as GroupsListResponse;
      },
      enabled: options?.enabled ?? true,
    },
    options?.queryClient,
  );
}

/**
 * Fetch the admin default group.
 * This is used by the Roles page to check if a group is the admin group.
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 */
export function useAdminGroupQuery(options?: { enabled?: boolean }): UseQueryResult<GroupOut | null> {
  const { axios } = useAppServices();
  const groupsApi = createGroupsApi(axios);

  return useQuery({
    queryKey: groupsKeys.adminGroup(),
    queryFn: async (): Promise<GroupOut | null> => {
      const response = await groupsApi.listGroups({
        limit: 1,
        adminDefault: true,
      });
      // Extract the first admin_default group from the response
      const groups = (response.data as GroupsListResponse)?.data ?? [];
      const adminGroup = groups.find((group) => group.admin_default);
      return adminGroup ?? null;
    },
    staleTime: 5 * 60 * 1000, // Admin group rarely changes, cache for 5 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch the system (platform default) group.
 * This is the "Default access" group that applies to all users.
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 */
export function useSystemGroupQuery(options?: { enabled?: boolean }): UseQueryResult<GroupOut | null> {
  const { axios } = useAppServices();
  const groupsApi = createGroupsApi(axios);

  return useQuery({
    queryKey: groupsKeys.systemGroup(),
    queryFn: async (): Promise<GroupOut | null> => {
      const response = await groupsApi.listGroups({
        limit: 1,
        platformDefault: true,
      });
      // Extract the first platform_default group from the response
      const groups = (response.data as GroupsListResponse)?.data ?? [];
      const systemGroup = groups.find((group) => group.platform_default);
      return systemGroup ?? null;
    },
    staleTime: 5 * 60 * 1000, // System group rarely changes, cache for 5 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch a single group by ID.
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useGroupQuery(id: string, options?: QueryOptions): UseQueryResult<GroupOut> {
  const { axios } = useAppServices();
  const groupsApi = createGroupsApi(axios);

  return useQuery(
    {
      queryKey: groupsKeys.detail(id),
      queryFn: async (): Promise<GroupOut> => {
        const response = await groupsApi.getGroup({ uuid: id });
        return response.data as GroupOut;
      },
      enabled: (options?.enabled ?? true) && !!id,
    },
    options?.queryClient,
  );
}

/**
 * Fetch members (principals) of a group.
 * Returns unwrapped, typed members array and total count.
 * Supports pagination and filtering.
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useGroupMembersQuery(
  groupId: string,
  params: UseGroupMembersQueryParams = {},
  options?: QueryOptions,
): UseQueryResult<MembersQueryResult> {
  const { axios } = useAppServices();
  const groupsApi = createGroupsApi(axios);
  const { limit = 20, offset = 0, orderBy, username } = params;

  return useQuery(
    {
      // Include params in query key for proper cache invalidation
      queryKey: [...groupsKeys.members(groupId), { limit, offset, orderBy, username }],
      queryFn: async (): Promise<MembersQueryResult> => {
        const response = await groupsApi.getPrincipalsFromGroup({
          uuid: groupId,
          principalUsername: username,
          limit,
          offset,
          orderBy: orderBy as GetPrincipalsFromGroupParams['orderBy'],
          principalType: 'user',
        });

        // Unwrap axios response - response.data contains the API response body
        const data = response.data as PrincipalPagination;

        // Transform API response to clean typed structure
        const members: Member[] = (data?.data ?? []).map((principal) => ({
          username: principal.username,
          first_name: 'first_name' in principal ? (principal.first_name as string | undefined) : undefined,
          last_name: 'last_name' in principal ? (principal.last_name as string | undefined) : undefined,
          email: 'email' in principal ? (principal.email as string | undefined) : undefined,
          is_active: 'is_active' in principal ? (principal.is_active as boolean | undefined) : undefined,
          is_org_admin: 'is_org_admin' in principal ? (principal.is_org_admin as boolean | undefined) : undefined,
        }));

        return {
          members,
          totalCount: data?.meta?.count ?? members.length,
        };
      },
      enabled: (options?.enabled ?? true) && !!groupId,
    },
    options?.queryClient,
  );
}

export interface UseGroupRolesQueryParams {
  limit?: number;
  offset?: number;
  name?: string;
}

/**
 * Fetch roles assigned to a group.
 * Returns unwrapped, typed roles array and total count.
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useGroupRolesQuery(
  groupId: string,
  params: UseGroupRolesQueryParams = {},
  options?: QueryOptions,
): UseQueryResult<GroupRolesQueryResult> {
  const { axios } = useAppServices();
  const groupsApi = createGroupsApi(axios);
  const { limit = 1000, offset = 0, name } = params;

  return useQuery(
    {
      // Include params in query key for proper cache handling
      queryKey: [...groupsKeys.roles(groupId), { limit, offset, name }],
      queryFn: async (): Promise<GroupRolesQueryResult> => {
        const response = await groupsApi.listRolesForGroup({
          uuid: groupId,
          limit,
          offset,
          roleDisplayName: name, // Filter by role display name
        });
        const data = response.data as GroupRolesPagination;

        // Transform API response to clean typed structure
        const roles: GroupRole[] = (data?.data ?? []).map((role) => ({
          uuid: role.uuid,
          name: role.name,
          display_name: role.display_name,
          description: role.description,
          modified: role.modified,
          // V2 workspace fields may be present
          workspace: (role as GroupRole).workspace,
          workspaceId: (role as GroupRole).workspaceId,
        }));

        return {
          roles,
          totalCount: data?.meta?.count ?? roles.length,
        };
      },
      enabled: (options?.enabled ?? true) && !!groupId,
    },
    options?.queryClient,
  );
}

/**
 * Fetch roles available to add to a group (roles not currently in the group).
 * Uses the `exclude=true` parameter to get roles that can be added.
 * Returns count of available roles - useful for enabling/disabling "Add Role" button.
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 */
export function useAvailableRolesForGroupQuery(groupId: string, options?: { enabled?: boolean }): UseQueryResult<{ count: number }> {
  const { axios } = useAppServices();
  const groupsApi = createGroupsApi(axios);

  return useQuery({
    queryKey: [...groupsKeys.roles(groupId), 'available'],
    queryFn: async (): Promise<{ count: number }> => {
      const response = await groupsApi.listRolesForGroup({
        uuid: groupId,
        exclude: true, // This gets roles that can be added
        limit: 1, // We only need the count
      });
      const data = response.data as GroupRolesPagination;
      return { count: data?.meta?.count ?? 0 };
    },
    enabled: (options?.enabled ?? true) && !!groupId,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
}

/**
 * Available roles query parameters.
 */
export interface UseAvailableRolesListQueryParams {
  limit?: number;
  offset?: number;
  name?: string;
}

/**
 * Fetch full list of roles available to add to a group (roles not currently in the group).
 * Uses the `exclude=true` parameter to get roles that can be added.
 * Supports pagination and filtering.
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 */
export function useAvailableRolesListQuery(
  groupId: string,
  params: UseAvailableRolesListQueryParams = {},
  options?: { enabled?: boolean },
): UseQueryResult<GroupRolesQueryResult> {
  const { axios } = useAppServices();
  const groupsApi = createGroupsApi(axios);
  const { limit = 20, offset = 0, name } = params;

  return useQuery({
    queryKey: [...groupsKeys.roles(groupId), 'available-list', { limit, offset, name }],
    queryFn: async (): Promise<GroupRolesQueryResult> => {
      const response = await groupsApi.listRolesForGroup({
        uuid: groupId,
        exclude: true,
        limit,
        offset,
        roleName: name,
      });
      const data = response.data as GroupRolesPagination;

      // Transform API response to clean typed structure
      const roles: GroupRole[] = (data?.data ?? []).map((role) => ({
        uuid: role.uuid,
        name: role.name,
        display_name: role.display_name,
        description: role.description,
        modified: role.modified,
      }));

      return {
        roles,
        totalCount: data?.meta?.count ?? roles.length,
      };
    },
    enabled: (options?.enabled ?? true) && !!groupId,
  });
}

/**
 * Fetch service accounts in a group.
 * Returns typed ServiceAccountsListResponse with proper data/meta structure.
 * Supports pagination and filtering.
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 */
export function useGroupServiceAccountsQuery(
  groupId: string,
  params: UseGroupServiceAccountsQueryParams = {},
  options?: { enabled?: boolean },
): UseQueryResult<ServiceAccountsListResponse> {
  const { axios } = useAppServices();
  const groupsApi = createGroupsApi(axios);
  const { limit = 20, offset = 0, clientId, name, description } = params;

  return useQuery({
    // Include params in query key for proper cache invalidation
    queryKey: [...groupsKeys.serviceAccounts(groupId), { limit, offset, clientId, name, description }],
    queryFn: async (): Promise<ServiceAccountsListResponse> => {
      const response = await groupsApi.getPrincipalsFromGroup({
        uuid: groupId,
        principalUsername: clientId, // For service accounts, filter by clientId
        limit,
        offset,
        principalType: 'service-account',
        serviceAccountDescription: description,
        serviceAccountName: name,
      });

      // Unwrap axios response - response.data contains the API response body
      const data = response.data;

      // Transform response to match our typed structure
      const responseData = data as { data?: RawServiceAccountFromApi[]; meta?: { count?: number } };
      const serviceAccounts: ServiceAccount[] = (responseData?.data ?? []).map((principal) => ({
        uuid: principal.clientId || principal.username,
        clientId: principal.clientId || principal.username,
        name: principal.name || principal.username,
        owner: principal.owner,
        description: principal.description,
        // API returns Unix timestamp in seconds, convert to milliseconds for JS Date
        // Use explicit null check to handle valid epoch timestamp (0)
        time_created: principal.time_created != null ? principal.time_created * 1000 : undefined,
      }));

      return {
        data: serviceAccounts,
        meta: { count: responseData?.meta?.count ?? serviceAccounts.length },
      };
    },
    enabled: (options?.enabled ?? true) && !!groupId,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

interface CreateGroupParams {
  name: string;
  description?: string;
  user_list?: Array<{ username: string }>;
  roles_list?: string[];
}

/**
 * Create a new group with optional users and roles.
 * Behavior:
 * 1. Creates the group
 * 2. Adds principals (users) if provided
 * 3. Adds roles if provided
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useCreateGroupMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const groupsApi = createGroupsApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: async (params: CreateGroupParams) => {
        const newGroup = await groupsApi.createGroup({
          group: {
            name: params.name,
            ...(params.description && { description: params.description }),
          },
        });
        const groupData = newGroup.data;
        const groupUuid = groupData.uuid;

        if (!groupUuid) {
          throw new Error('Group creation failed: No UUID returned');
        }

        const promises: Promise<unknown>[] = [];

        // Add users if provided
        // Note: rbac-client type incorrectly requires 'type' and 'clientId' for all principals,
        // but the API accepts { username } for user principals. Using type assertion.
        if (params.user_list && params.user_list.length > 0) {
          promises.push(
            groupsApi.addPrincipalToGroup({
              uuid: groupUuid,
              groupPrincipalIn: {
                principals: params.user_list.map((user) => ({
                  username: user.username,
                })),
              } as AddPrincipalToGroupParams['groupPrincipalIn'],
            }),
          );
        }

        // Add roles if provided
        if (params.roles_list && params.roles_list.length > 0) {
          promises.push(
            groupsApi.addRoleToGroup({
              uuid: groupUuid,
              groupRoleIn: { roles: params.roles_list },
            }),
          );
        }

        await Promise.all(promises);
        return groupData;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: groupsKeys.all });
        notify('success', intl.formatMessage(messages.addGroupSuccessTitle));
      },
      onError: () => {
        notify('danger', intl.formatMessage(messages.addGroupErrorTitle));
      },
    },
    options?.queryClient,
  );
}

interface UpdateGroupParams {
  uuid: string;
  name: string;
  description?: string;
}

/**
 * Update an existing group.
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useUpdateGroupMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const groupsApi = createGroupsApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: async (params: UpdateGroupParams) => {
        const response = await groupsApi.updateGroup({
          uuid: params.uuid,
          group: {
            name: params.name,
            ...(params.description && { description: params.description }),
          },
        });
        return response.data;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: groupsKeys.all });
        notify('success', intl.formatMessage(messages.editGroupSuccessTitle), intl.formatMessage(messages.editGroupSuccessDescription));
      },
      onError: () => {
        notify('danger', intl.formatMessage(messages.editGroupErrorTitle), intl.formatMessage(messages.editGroupErrorDescription));
      },
    },
    options?.queryClient,
  );
}

/**
 * Delete a group.
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useDeleteGroupMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const groupsApi = createGroupsApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: async (uuid: string) => {
        await groupsApi.deleteGroup({ uuid });
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: groupsKeys.all });
        notify('success', intl.formatMessage(messages.removeGroupSuccess));
      },
      onError: () => {
        notify('danger', intl.formatMessage(messages.removeGroupError));
      },
    },
    options?.queryClient,
  );
}

interface AddMembersToGroupParams {
  groupId: string;
  usernames: string[];
}

/**
 * Add members to a group.
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useAddMembersToGroupMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const groupsApi = createGroupsApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: async ({ groupId, usernames }: AddMembersToGroupParams) => {
        // Note: rbac-client type incorrectly requires 'type' and 'clientId' for all principals,
        // but the API accepts { username } for user principals. Using type assertion.
        const response = await groupsApi.addPrincipalToGroup({
          uuid: groupId,
          groupPrincipalIn: {
            principals: usernames.map((username) => ({ username })),
          } as AddPrincipalToGroupParams['groupPrincipalIn'],
        });
        return response.data;
      },
      onSuccess: (_, variables) => {
        qc.invalidateQueries({ queryKey: groupsKeys.members(variables.groupId) });
        qc.invalidateQueries({ queryKey: groupsKeys.lists() });
        // Also invalidate users query since user_groups_count changes
        qc.invalidateQueries({ queryKey: ['users'] });
        const multiple = variables.usernames.length > 1;
        notify('success', intl.formatMessage(multiple ? messages.addGroupMembersSuccessTitle : messages.addGroupMemberSuccessTitle));
      },
      onError: (_, variables) => {
        const multiple = variables.usernames.length > 1;
        notify('danger', intl.formatMessage(multiple ? messages.addGroupMembersErrorTitle : messages.addGroupMemberErrorTitle));
      },
    },
    options?.queryClient,
  );
}

interface RemoveMembersFromGroupParams {
  groupId: string;
  usernames: string[];
}

/**
 * Remove members from a group.
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useRemoveMembersFromGroupMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const groupsApi = createGroupsApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: async ({ groupId, usernames }: RemoveMembersFromGroupParams) => {
        // API expects comma-separated usernames
        await groupsApi.deletePrincipalFromGroup({
          uuid: groupId,
          usernames: usernames.join(','),
        });
      },
      onSuccess: (_, variables) => {
        qc.invalidateQueries({ queryKey: groupsKeys.members(variables.groupId) });
        qc.invalidateQueries({ queryKey: groupsKeys.lists() });
        // Also invalidate users query since user_groups_count changes
        qc.invalidateQueries({ queryKey: ['users'] });
        // Always use plural form
        notify(
          'success',
          intl.formatMessage(messages.removeGroupMembersSuccessTitle),
          intl.formatMessage(messages.removeGroupMembersSuccessDescription),
        );
      },
      onError: () => {
        // Always use plural form
        notify('danger', intl.formatMessage(messages.removeGroupMembersErrorTitle), intl.formatMessage(messages.removeGroupMembersErrorDescription));
      },
    },
    options?.queryClient,
  );
}

interface AddRolesToGroupParams {
  groupId: string;
  roleUuids: string[];
}

/**
 * Add roles to a group.
 * This properly invalidates all related caches including the group detail
 * to ensure UI reflects any server-side changes (like group renaming when modifying defaults).
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useAddRolesToGroupMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const groupsApi = createGroupsApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: async ({ groupId, roleUuids }: AddRolesToGroupParams) => {
        await groupsApi.addRoleToGroup({
          uuid: groupId,
          groupRoleIn: { roles: roleUuids },
        });
      },
      onSuccess: (_, variables) => {
        // Invalidate all group-related queries to ensure fresh data
        // This is critical when modifying default groups as the server may rename them
        qc.invalidateQueries({ queryKey: groupsKeys.detail(variables.groupId) });
        qc.invalidateQueries({ queryKey: groupsKeys.roles(variables.groupId) });
        qc.invalidateQueries({ queryKey: groupsKeys.lists() });
        notify('success', intl.formatMessage(messages.addGroupRolesSuccessTitle));
      },
      onError: () => {
        notify('danger', intl.formatMessage(messages.addGroupRolesErrorTitle));
      },
    },
    options?.queryClient,
  );
}

interface RemoveRolesFromGroupParams {
  groupId: string;
  roleUuids: string[];
}

/**
 * Remove roles from a group.
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useRemoveRolesFromGroupMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const groupsApi = createGroupsApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: async ({ groupId, roleUuids }: RemoveRolesFromGroupParams) => {
        await groupsApi.deleteRoleFromGroup({
          uuid: groupId,
          roles: roleUuids.join(','),
        });
      },
      onSuccess: (_, variables) => {
        qc.invalidateQueries({ queryKey: groupsKeys.roles(variables.groupId) });
        qc.invalidateQueries({ queryKey: groupsKeys.lists() });
        notify('success', intl.formatMessage(messages.removeGroupRolesSuccessTitle));
      },
      onError: () => {
        notify('danger', intl.formatMessage(messages.removeGroupRolesErrorTitle));
      },
    },
    options?.queryClient,
  );
}

interface AddServiceAccountsToGroupParams {
  groupId: string;
  serviceAccounts: string[]; // clientIds
}

/**
 * Add service accounts to a group (V1 - stable API).
 * Uses the principals API with type: 'service-account'.
 * For use in features/groups (legacy groups management).
 * Uses injected services from ServiceContext - works in both browser and CLI.
 */
export function useAddServiceAccountsToGroupMutationV1(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const groupsApi = createGroupsApi(axios);
  const queryClient = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, serviceAccounts }: AddServiceAccountsToGroupParams) => {
      // Use the stable principals API with service-account type
      // Note: The rbac-client GroupPrincipalIn type expects 'username' but for service accounts
      // we need to send 'clientId' and 'type'. Using type assertion for this known API behavior.
      const response = await groupsApi.addPrincipalToGroup({
        uuid: groupId,
        groupPrincipalIn: {
          principals: serviceAccounts.map((clientId) => ({
            clientId,
            type: 'service-account',
          })),
        } as AddPrincipalToGroupParams['groupPrincipalIn'],
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.serviceAccounts(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      const multiple = variables.serviceAccounts.length > 1;
      notify('success', intl.formatMessage(multiple ? messages.addGroupServiceAccountsSuccessTitle : messages.addGroupServiceAccountSuccessTitle));
    },
    onError: (_, variables) => {
      const multiple = variables.serviceAccounts.length > 1;
      notify('danger', intl.formatMessage(multiple ? messages.addGroupServiceAccountsErrorTitle : messages.addGroupServiceAccountErrorTitle));
    },
  });
}

/**
 * Add service accounts to a group (V2 - guessed API).
 * GAP: Using guessed V2 API - POST /api/rbac/v2/groups/:uuid/service-accounts/
 * This API endpoint is not yet confirmed - this is an educated guess.
 * For use in access-management feature.
 * Uses injected services from ServiceContext - works in both browser and CLI.
 */
export function useAddServiceAccountsToGroupMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const queryClient = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, serviceAccounts }: AddServiceAccountsToGroupParams) => {
      // GAP: This endpoint is guessed - actual V2 API may differ
      // Use axios for consistent behavior across environments
      const response = await axios.post(`/api/rbac/v2/groups/${groupId}/service-accounts/`, {
        service_accounts: serviceAccounts.map((clientId) => ({ clientId })),
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.serviceAccounts(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      const multiple = variables.serviceAccounts.length > 1;
      notify('success', intl.formatMessage(multiple ? messages.addGroupServiceAccountsSuccessTitle : messages.addGroupServiceAccountSuccessTitle));
    },
    onError: (_, variables) => {
      const multiple = variables.serviceAccounts.length > 1;
      notify('danger', intl.formatMessage(multiple ? messages.addGroupServiceAccountsErrorTitle : messages.addGroupServiceAccountErrorTitle));
    },
  });
}

interface RemoveServiceAccountsFromGroupParams {
  groupId: string;
  serviceAccounts: string[]; // clientIds
}

/**
 * Remove service accounts from a group (V1 - stable API).
 * Uses the principals API with comma-separated client IDs.
 * For use in features/groups (legacy groups management).
 * Uses injected services from ServiceContext - works in both browser and CLI.
 */
export function useRemoveServiceAccountsFromGroupMutationV1(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const groupsApi = createGroupsApi(axios);
  const queryClient = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, serviceAccounts }: RemoveServiceAccountsFromGroupParams) => {
      // Use the stable principals API - service account client IDs are passed as comma-separated
      await groupsApi.deletePrincipalFromGroup({
        uuid: groupId,
        serviceAccounts: serviceAccounts.join(','),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.serviceAccounts(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      const multiple = variables.serviceAccounts.length > 1;
      notify(
        'success',
        intl.formatMessage(multiple ? messages.removeGroupServiceAccountsSuccessTitle : messages.removeGroupServiceAccountSuccessTitle),
      );
    },
    onError: (_, variables) => {
      const multiple = variables.serviceAccounts.length > 1;
      notify('danger', intl.formatMessage(multiple ? messages.removeGroupServiceAccountsErrorTitle : messages.removeGroupServiceAccountErrorTitle));
    },
  });
}

/**
 * Remove service accounts from a group (V2 - guessed API).
 * GAP: Using guessed V2 API - DELETE /api/rbac/v2/groups/:uuid/service-accounts/
 * This API endpoint is not yet confirmed - this is an educated guess.
 * For use in access-management feature.
 * Uses injected services from ServiceContext - works in both browser and CLI.
 */
export function useRemoveServiceAccountsFromGroupMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const queryClient = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, serviceAccounts }: RemoveServiceAccountsFromGroupParams) => {
      // GAP: This endpoint is guessed - actual V2 API may differ
      // Use axios for consistent behavior across environments
      const response = await axios.delete(`/api/rbac/v2/groups/${groupId}/service-accounts/`, {
        data: {
          service_accounts: serviceAccounts.map((clientId) => ({ clientId })),
        },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.serviceAccounts(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      const multiple = variables.serviceAccounts.length > 1;
      notify(
        'success',
        intl.formatMessage(multiple ? messages.removeGroupServiceAccountsSuccessTitle : messages.removeGroupServiceAccountSuccessTitle),
      );
    },
    onError: (_, variables) => {
      const multiple = variables.serviceAccounts.length > 1;
      notify('danger', intl.formatMessage(multiple ? messages.removeGroupServiceAccountsErrorTitle : messages.removeGroupServiceAccountErrorTitle));
    },
  });
}

// Re-export types from API layer (Group is defined locally, extending GroupOut)
export type { GroupOut, ListGroupsParams, GroupWithPrincipals, GroupWithPrincipalsAndRoles } from '../api/groups';
