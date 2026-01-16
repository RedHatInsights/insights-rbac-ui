import { type UseQueryResult, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import {
  type GroupOut,
  type GroupPagination,
  type GroupRolesPagination,
  type ListGroupsParams,
  type PrincipalPagination,
  groupsApi,
} from '../api/groups';
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
 * Role type for group roles (with optional V2 binding fields).
 */
export interface GroupRole {
  uuid: string;
  name: string;
  display_name?: string;
  description?: string;
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
  uuid?: string;
  clientId: string;
  name: string;
  owner?: string;
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
 */
export function useGroupMembersQuery(groupId: string, options?: { enabled?: boolean }): UseQueryResult<MembersQueryResult> {
  return useQuery({
    queryKey: groupsKeys.members(groupId),
    queryFn: async (): Promise<MembersQueryResult> => {
      const response = await groupsApi.getPrincipalsFromGroup({ uuid: groupId });
      const data = response.data as PrincipalPagination;

      // Transform API response to clean typed structure
      const members: Member[] = (data?.data ?? []).map((principal) => ({
        username: principal.username,
        first_name: 'first_name' in principal ? principal.first_name : undefined,
        last_name: 'last_name' in principal ? principal.last_name : undefined,
        email: 'email' in principal ? principal.email : undefined,
        is_active: 'is_active' in principal ? principal.is_active : undefined,
        is_org_admin: 'is_org_admin' in principal ? principal.is_org_admin : undefined,
      }));

      return {
        members,
        totalCount: data?.meta?.count ?? members.length,
      };
    },
    enabled: (options?.enabled ?? true) && !!groupId,
  });
}

/**
 * Fetch roles assigned to a group.
 * Returns unwrapped, typed roles array and total count.
 */
export function useGroupRolesQuery(groupId: string, options?: { enabled?: boolean; limit?: number }): UseQueryResult<GroupRolesQueryResult> {
  return useQuery({
    queryKey: groupsKeys.roles(groupId),
    queryFn: async (): Promise<GroupRolesQueryResult> => {
      const response = await groupsApi.listRolesForGroup({
        uuid: groupId,
        limit: options?.limit ?? 1000,
      });
      const data = response.data as GroupRolesPagination;

      // Transform API response to clean typed structure
      const roles: GroupRole[] = (data?.data ?? []).map((role) => ({
        uuid: role.uuid,
        name: role.name,
        display_name: role.display_name,
        description: role.description,
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
 * Fetch service accounts in a group.
 * Note: Uses getPrincipalsFromGroup with serviceAccountClientIds filter.
 */
/**
 * Fetch service accounts in a group.
 * Returns typed ServiceAccountsListResponse with proper data/meta structure.
 *
 * @tag gap:guessed-v2-api - The exact API structure for service accounts in groups is guessed.
 */
export function useGroupServiceAccountsQuery(groupId: string, options?: { enabled?: boolean }): UseQueryResult<ServiceAccountsListResponse> {
  return useQuery({
    queryKey: groupsKeys.serviceAccounts(groupId),
    queryFn: async (): Promise<ServiceAccountsListResponse> => {
      // The API returns both users and service accounts based on query params
      // For service accounts, we need to use principalType=service-account
      // Note: Type assertion needed due to rbac-client type definition limitations
      const response = await groupsApi.getPrincipalsFromGroup({
        uuid: groupId,
        principalType: 'service-account',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Transform response to match our typed structure
      // Response may contain service accounts with rich data or minimal principal data
      interface RawServiceAccount {
        username: string;
        clientId?: string;
        name?: string;
        owner?: string;
        description?: string;
      }
      const responseData = response.data as { data?: RawServiceAccount[]; meta?: { count?: number } };
      const serviceAccounts: ServiceAccount[] = (responseData?.data ?? []).map((principal) => ({
        uuid: principal.clientId || principal.username,
        clientId: principal.clientId || principal.username,
        name: principal.name || principal.username,
        owner: principal.owner,
        description: principal.description,
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
}

/**
 * Create a new group.
 */
export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async (params: CreateGroupParams) => {
      const response = await groupsApi.createGroup({
        group: {
          name: params.name,
          description: params.description,
        },
      });
      return response.data;
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
      const response = await groupsApi.updateGroup({
        uuid: params.uuid,
        group: {
          name: params.name,
          description: params.description,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.all });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.editGroupSuccessTitle),
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
      const multiple = variables.usernames.length > 1;
      addNotification({
        variant: 'success',
        title: intl.formatMessage(multiple ? messages.removeGroupMembersSuccessTitle : messages.removeGroupMemberSuccessTitle),
        dismissable: true,
      });
    },
    onError: (_, variables) => {
      const multiple = variables.usernames.length > 1;
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(multiple ? messages.removeGroupMembersErrorTitle : messages.removeGroupMemberErrorTitle),
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
 * Add service accounts to a group.
 * GAP: Using guessed V1-style API - POST /api/rbac/v1/groups/:uuid/service-accounts/
 * This API endpoint is not yet confirmed - this is an educated guess based on the principals API pattern.
 */
export function useAddServiceAccountsToGroupMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, serviceAccounts }: AddServiceAccountsToGroupParams) => {
      // GAP: This endpoint is guessed based on the principals pattern
      // The actual V2 API may differ
      const response = await fetch(`/api/rbac/v1/groups/${groupId}/service-accounts/`, {
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
 * Remove service accounts from a group.
 * GAP: Using guessed V1-style API - DELETE /api/rbac/v1/groups/:uuid/service-accounts/
 * This API endpoint is not yet confirmed - this is an educated guess based on the principals API pattern.
 */
export function useRemoveServiceAccountsFromGroupMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ groupId, serviceAccounts }: RemoveServiceAccountsFromGroupParams) => {
      // GAP: This endpoint is guessed based on the principals pattern
      // The actual V2 API may differ
      const response = await fetch(`/api/rbac/v1/groups/${groupId}/service-accounts/`, {
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
