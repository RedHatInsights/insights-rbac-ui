import { type UseQueryResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { type GroupOut, type GroupPagination, type GroupRolesPagination, type ListGroupsParams, groupsApi } from '../api/groups';
import messages from '../../Messages';

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
 * Extends GroupOut with optional fields that may come from different API versions.
 */
export interface Group extends GroupOut {
  principalCount?: number;
  roleCount?: number;
  serviceAccountCount?: number;
  workspaceCount?: number;
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
 * Note: Service accounts come from SSO API, not RBAC API.
 */
export interface ServiceAccount {
  uuid: string;
  clientId: string;
  name: string;
  owner?: string;
  description?: string;
  time_created?: string;
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
 */
export function useGroupsQuery(params: UseGroupsQueryParams = {}, options?: { enabled?: boolean }): UseQueryResult<GroupsListResponse> {
  return useQuery({
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
  });
}

/**
 * Fetch the admin default group.
 * This is used by the Roles page to check if a group is the admin group.
 */
export function useAdminGroupQuery(options?: { enabled?: boolean }): UseQueryResult<GroupOut | null> {
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
 */
export function useSystemGroupQuery(options?: { enabled?: boolean }): UseQueryResult<GroupOut | null> {
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
 */
export function useGroupQuery(id: string, options?: { enabled?: boolean }): UseQueryResult<GroupOut> {
  return useQuery({
    queryKey: groupsKeys.detail(id),
    queryFn: async (): Promise<GroupOut> => {
      const response = await groupsApi.getGroup({ uuid: id });
      return response.data as GroupOut;
    },
    enabled: (options?.enabled ?? true) && !!id,
  });
}

/**
 * Fetch members (principals) of a group.
 * Returns unwrapped, typed members array and total count.
 * Supports pagination and filtering.
 */
export function useGroupMembersQuery(
  groupId: string,
  params: UseGroupMembersQueryParams = {},
  options?: { enabled?: boolean },
): UseQueryResult<MembersQueryResult> {
  const { limit = 20, offset = 0, orderBy, username } = params;

  return useQuery({
    // Include params in query key for proper cache invalidation
    queryKey: [...groupsKeys.members(groupId), { limit, offset, orderBy, username }],
    queryFn: async (): Promise<MembersQueryResult> => {
      // Call API with positional params
      // Order: uuid, adminOnly, principalUsername, limit, offset, orderBy, usernameOnly, principalType, serviceAccountClientIds, serviceAccountDescription, serviceAccountName, options
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (groupsApi.getPrincipalsFromGroup as any)(
        groupId, // uuid
        undefined, // adminOnly
        username, // principalUsername - filter by username
        limit, // limit
        offset, // offset
        orderBy, // orderBy
        undefined, // usernameOnly
        'user', // principalType - always user for members
        undefined, // serviceAccountClientIds
        undefined, // serviceAccountDescription
        undefined, // serviceAccountName
        undefined, // options
      );

      // Unwrap axios response - response.data contains the API response body
      const data = response.data;

      // Transform API response to clean typed structure
      const members: Member[] = (data?.data ?? []).map((principal: Record<string, unknown>) => ({
        username: principal.username as string,
        first_name: principal.first_name as string | undefined,
        last_name: principal.last_name as string | undefined,
        email: principal.email as string | undefined,
        is_active: principal.is_active as boolean | undefined,
        is_org_admin: principal.is_org_admin as boolean | undefined,
      }));

      return {
        members,
        totalCount: data?.meta?.count ?? members.length,
      };
    },
    enabled: (options?.enabled ?? true) && !!groupId,
  });
}

export interface UseGroupRolesQueryParams {
  limit?: number;
  offset?: number;
  name?: string;
}

/**
 * Fetch roles assigned to a group.
 * Returns unwrapped, typed roles array and total count.
 */
export function useGroupRolesQuery(
  groupId: string,
  params: UseGroupRolesQueryParams = {},
  options?: { enabled?: boolean },
): UseQueryResult<GroupRolesQueryResult> {
  const { limit = 1000, offset = 0, name } = params;

  return useQuery({
    // Include params in query key for proper cache handling
    queryKey: [...groupsKeys.roles(groupId), { limit, offset, name }],
    queryFn: async (): Promise<GroupRolesQueryResult> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (groupsApi.listRolesForGroup as any)({
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
  });
}

/**
 * Fetch roles available to add to a group (roles not currently in the group).
 * Uses the `excluded=true` parameter to get roles that can be added.
 * Returns count of available roles - useful for enabling/disabling "Add Role" button.
 */
export function useAvailableRolesForGroupQuery(groupId: string, options?: { enabled?: boolean }): UseQueryResult<{ count: number }> {
  return useQuery({
    queryKey: [...groupsKeys.roles(groupId), 'available'],
    queryFn: async (): Promise<{ count: number }> => {
      // Call API with excluded=true to get roles NOT in the group
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (groupsApi.listRolesForGroup as any)({
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
 * Uses the `excluded=true` parameter to get roles that can be added.
 * Supports pagination and filtering.
 */
export function useAvailableRolesListQuery(
  groupId: string,
  params: UseAvailableRolesListQueryParams = {},
  options?: { enabled?: boolean },
): UseQueryResult<GroupRolesQueryResult> {
  const { limit = 20, offset = 0, name } = params;

  return useQuery({
    queryKey: [...groupsKeys.roles(groupId), 'available-list', { limit, offset, name }],
    queryFn: async (): Promise<GroupRolesQueryResult> => {
      // Call API with excluded=true to get roles NOT in the group
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (groupsApi.listRolesForGroup as any)({
        uuid: groupId,
        exclude: true,
        limit,
        offset,
        ...(name ? { roleName: name } : {}),
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
 *
 * @tag gap:guessed-v2-api - The exact API structure for service accounts in groups is guessed.
 */
export function useGroupServiceAccountsQuery(
  groupId: string,
  params: UseGroupServiceAccountsQueryParams = {},
  options?: { enabled?: boolean },
): UseQueryResult<ServiceAccountsListResponse> {
  const { limit = 20, offset = 0, clientId, name, description } = params;

  return useQuery({
    // Include params in query key for proper cache invalidation
    queryKey: [...groupsKeys.serviceAccounts(groupId), { limit, offset, clientId, name, description }],
    queryFn: async (): Promise<ServiceAccountsListResponse> => {
      // Call API with positional params
      // Order: uuid, adminOnly, principalUsername, limit, offset, orderBy, usernameOnly, principalType, serviceAccountClientIds, serviceAccountDescription, serviceAccountName, options
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (groupsApi.getPrincipalsFromGroup as any)(
        groupId, // uuid
        undefined, // adminOnly
        clientId, // principalUsername - for service accounts this is clientId
        limit, // limit
        offset, // offset
        undefined, // orderBy
        undefined, // usernameOnly
        'service-account', // principalType
        undefined, // serviceAccountClientIds
        description, // serviceAccountDescription
        name, // serviceAccountName
        undefined, // options
      );

      // Unwrap axios response - response.data contains the API response body
      const data = response.data;

      // Transform response to match our typed structure
      interface RawServiceAccount {
        username: string;
        clientId?: string;
        name?: string;
        owner?: string;
        description?: string;
        time_created?: string;
      }
      const responseData = data as { data?: RawServiceAccount[]; meta?: { count?: number } };
      const serviceAccounts: ServiceAccount[] = (responseData?.data ?? []).map((principal) => ({
        uuid: principal.clientId || principal.username,
        clientId: principal.clientId || principal.username,
        name: principal.name || principal.username,
        owner: principal.owner,
        description: principal.description,
        time_created: principal.time_created,
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
 * Mirrors the old Redux behavior:
 * 1. Creates the group
 * 2. Adds principals (users) if provided
 * 3. Adds roles if provided
 */
export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async (params: CreateGroupParams) => {
      // Match old Redux helper: passes full object to createGroup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newGroup = await (groupsApi.createGroup as any)(params, undefined);
      const groupData = newGroup.data ?? newGroup;
      const groupUuid = groupData.uuid;

      if (!groupUuid) {
        throw new Error('Group creation failed: No UUID returned');
      }

      const promises: Promise<unknown>[] = [];

      // Add users if provided
      if (params.user_list && params.user_list.length > 0) {
        const groupPrincipalIn = {
          principals: params.user_list.map((user) => ({
            username: user.username,
          })),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        promises.push((groupsApi.addPrincipalToGroup as any)(groupUuid, groupPrincipalIn, undefined));
      }

      // Add roles if provided
      if (params.roles_list && params.roles_list.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        promises.push((groupsApi.addRoleToGroup as any)(groupUuid, { roles: params.roles_list }, undefined));
      }

      await Promise.all(promises);
      return groupData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.all });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.addGroupSuccessTitle),
        dismissable: true,
      });
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.editGroupErrorTitle),
        dismissable: true,
      });
    },
  });
}

interface UpdateGroupParams {
  uuid: string;
  name: string;
  description?: string;
}

/**
 * Update an existing group.
 */
export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async (params: UpdateGroupParams) => {
      // Match the old Redux helper behavior: updateGroup(uuid, data, options)
      // The API expects the body to include uuid, name, description
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (groupsApi.updateGroup as any)(
        params.uuid,
        { uuid: params.uuid, name: params.name, description: params.description },
        undefined,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.all });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.editGroupSuccessTitle),
        description: intl.formatMessage(messages.editGroupSuccessDescription),
        dismissable: true,
      });
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.editGroupErrorTitle),
        description: intl.formatMessage(messages.editGroupErrorDescription),
        dismissable: true,
      });
    },
  });
}

/**
 * Delete a group.
 */
export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async (uuid: string) => {
      await groupsApi.deleteGroup({ uuid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.all });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.removeGroupSuccess),
        dismissable: true,
      });
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.removeGroupError),
        dismissable: true,
      });
    },
  });
}

interface AddMembersToGroupParams {
  groupId: string;
  usernames: string[];
}

/**
 * Add members to a group.
 */
export function useAddMembersToGroupMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, usernames }: AddMembersToGroupParams) => {
      // Note: Type assertion needed due to rbac-client type issues
      const response = await groupsApi.addPrincipalToGroup({
        uuid: groupId,
        groupPrincipalIn: {
          principals: usernames.map((username) => ({ username })),
        } as any,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.members(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      // Also invalidate users query since user_groups_count changes
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const multiple = variables.usernames.length > 1;
      addNotification({
        variant: 'success',
        title: intl.formatMessage(multiple ? messages.addGroupMembersSuccessTitle : messages.addGroupMemberSuccessTitle),
        dismissable: true,
      });
    },
    onError: (_, variables) => {
      const multiple = variables.usernames.length > 1;
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(multiple ? messages.addGroupMembersErrorTitle : messages.addGroupMemberErrorTitle),
        dismissable: true,
      });
    },
  });
}

interface RemoveMembersFromGroupParams {
  groupId: string;
  usernames: string[];
}

/**
 * Remove members from a group.
 */
export function useRemoveMembersFromGroupMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, usernames }: RemoveMembersFromGroupParams) => {
      // API expects comma-separated usernames
      await groupsApi.deletePrincipalFromGroup({
        uuid: groupId,
        usernames: usernames.join(','),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.members(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      // Also invalidate users query since user_groups_count changes
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Match old Redux behavior: always use plural form
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.removeGroupMembersSuccessTitle),
        description: intl.formatMessage(messages.removeGroupMembersSuccessDescription),
        dismissable: true,
      });
    },
    onError: () => {
      // Match old Redux behavior: always use plural form
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.removeGroupMembersErrorTitle),
        description: intl.formatMessage(messages.removeGroupMembersErrorDescription),
        dismissable: true,
      });
    },
  });
}

interface AddRolesToGroupParams {
  groupId: string;
  roleUuids: string[];
}

/**
 * Add roles to a group.
 * This properly invalidates all related caches including the group detail
 * to ensure UI reflects any server-side changes (like group renaming when modifying defaults).
 */
export function useAddRolesToGroupMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, roleUuids }: AddRolesToGroupParams) => {
      await groupsApi.addRoleToGroup({
        uuid: groupId,
        groupRoleIn: { roles: roleUuids },
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate all group-related queries to ensure fresh data
      // This is critical when modifying default groups as the server may rename them
      queryClient.invalidateQueries({ queryKey: groupsKeys.detail(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.roles(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.addGroupRolesSuccessTitle),
        dismissable: true,
      });
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.addGroupRolesErrorTitle),
        dismissable: true,
      });
    },
  });
}

interface RemoveRolesFromGroupParams {
  groupId: string;
  roleUuids: string[];
}

/**
 * Remove roles from a group.
 */
export function useRemoveRolesFromGroupMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, roleUuids }: RemoveRolesFromGroupParams) => {
      await groupsApi.deleteRoleFromGroup({
        uuid: groupId,
        roles: roleUuids.join(','),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.roles(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.removeGroupRolesSuccessTitle),
        dismissable: true,
      });
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.removeGroupRolesErrorTitle),
        dismissable: true,
      });
    },
  });
}

interface AddServiceAccountsToGroupParams {
  groupId: string;
  serviceAccounts: string[]; // clientIds
}

/**
 * Add service accounts to a group (V1 - stable API).
 * Uses the principals API with type: 'service-account'.
 * For use in features/groups (legacy groups management).
 */
export function useAddServiceAccountsToGroupMutationV1() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, serviceAccounts }: AddServiceAccountsToGroupParams) => {
      // Use the stable principals API with service-account type
      const groupPrincipalIn = {
        principals: serviceAccounts.map((clientId) => ({
          clientId,
          type: 'service-account' as const,
        })),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (groupsApi.addPrincipalToGroup as any)(groupId, groupPrincipalIn, undefined);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.serviceAccounts(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      const multiple = variables.serviceAccounts.length > 1;
      addNotification({
        variant: 'success',
        title: intl.formatMessage(multiple ? messages.addGroupServiceAccountsSuccessTitle : messages.addGroupServiceAccountSuccessTitle),
        dismissable: true,
      });
    },
    onError: (_, variables) => {
      const multiple = variables.serviceAccounts.length > 1;
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(multiple ? messages.addGroupServiceAccountsErrorTitle : messages.addGroupServiceAccountErrorTitle),
        dismissable: true,
      });
    },
  });
}

/**
 * Add service accounts to a group (V2 - guessed API).
 * GAP: Using guessed V2 API - POST /api/rbac/v2/groups/:uuid/service-accounts/
 * This API endpoint is not yet confirmed - this is an educated guess.
 * For use in access-management feature.
 */
export function useAddServiceAccountsToGroupMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, serviceAccounts }: AddServiceAccountsToGroupParams) => {
      // GAP: This endpoint is guessed - actual V2 API may differ
      const response = await fetch(`/api/rbac/v2/groups/${groupId}/service-accounts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_accounts: serviceAccounts.map((clientId) => ({ clientId })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add service accounts to group');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.serviceAccounts(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      const multiple = variables.serviceAccounts.length > 1;
      addNotification({
        variant: 'success',
        title: intl.formatMessage(multiple ? messages.addGroupServiceAccountsSuccessTitle : messages.addGroupServiceAccountSuccessTitle),
        dismissable: true,
      });
    },
    onError: (_, variables) => {
      const multiple = variables.serviceAccounts.length > 1;
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(multiple ? messages.addGroupServiceAccountsErrorTitle : messages.addGroupServiceAccountErrorTitle),
        dismissable: true,
      });
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
 */
export function useRemoveServiceAccountsFromGroupMutationV1() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, serviceAccounts }: RemoveServiceAccountsFromGroupParams) => {
      // Use the stable principals API - service account client IDs are passed as comma-separated
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (groupsApi.deletePrincipalFromGroup as any)(groupId, undefined, serviceAccounts.join(','), undefined);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.serviceAccounts(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      const multiple = variables.serviceAccounts.length > 1;
      addNotification({
        variant: 'success',
        title: intl.formatMessage(multiple ? messages.removeGroupServiceAccountsSuccessTitle : messages.removeGroupServiceAccountSuccessTitle),
        dismissable: true,
      });
    },
    onError: (_, variables) => {
      const multiple = variables.serviceAccounts.length > 1;
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(multiple ? messages.removeGroupServiceAccountsErrorTitle : messages.removeGroupServiceAccountErrorTitle),
        dismissable: true,
      });
    },
  });
}

/**
 * Remove service accounts from a group (V2 - guessed API).
 * GAP: Using guessed V2 API - DELETE /api/rbac/v2/groups/:uuid/service-accounts/
 * This API endpoint is not yet confirmed - this is an educated guess.
 * For use in access-management feature.
 */
export function useRemoveServiceAccountsFromGroupMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, serviceAccounts }: RemoveServiceAccountsFromGroupParams) => {
      // GAP: This endpoint is guessed - actual V2 API may differ
      const response = await fetch(`/api/rbac/v2/groups/${groupId}/service-accounts/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_accounts: serviceAccounts.map((clientId) => ({ clientId })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove service accounts from group');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.serviceAccounts(variables.groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      const multiple = variables.serviceAccounts.length > 1;
      addNotification({
        variant: 'success',
        title: intl.formatMessage(multiple ? messages.removeGroupServiceAccountsSuccessTitle : messages.removeGroupServiceAccountSuccessTitle),
        dismissable: true,
      });
    },
    onError: (_, variables) => {
      const multiple = variables.serviceAccounts.length > 1;
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(multiple ? messages.removeGroupServiceAccountsErrorTitle : messages.removeGroupServiceAccountErrorTitle),
        dismissable: true,
      });
    },
  });
}

// Re-export types from API layer (Group is defined locally, extending GroupOut)
export type { GroupOut, ListGroupsParams, GroupWithPrincipals, GroupWithPrincipalsAndRoles } from '../api/groups';
