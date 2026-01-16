import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { type GroupOut, type ListGroupsParams, groupsApi } from '../api/groups';
import messages from '../../Messages';

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
 */
export function useGroupsQuery(params: UseGroupsQueryParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: groupsKeys.list(params as ListGroupsParams),
    queryFn: async () => {
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
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch the admin default group.
 * This is used by the Roles page to check if a group is the admin group.
 */
export function useAdminGroupQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: groupsKeys.adminGroup(),
    queryFn: async () => {
      const response = await groupsApi.listGroups({
        limit: 1,
        adminDefault: true,
      });
      // Extract the first admin_default group from the response
      const adminGroup = response.data?.data?.find((group: GroupOut) => group.admin_default);
      return adminGroup ?? null;
    },
    staleTime: 5 * 60 * 1000, // Admin group rarely changes, cache for 5 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch a single group by ID.
 */
export function useGroupQuery(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: groupsKeys.detail(id),
    queryFn: async () => {
      const response = await groupsApi.getGroup({ uuid: id });
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!id,
  });
}

/**
 * Fetch members (principals) of a group.
 */
export function useGroupMembersQuery(groupId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: groupsKeys.members(groupId),
    queryFn: async () => {
      const response = await groupsApi.getPrincipalsFromGroup({ uuid: groupId });
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!groupId,
  });
}

/**
 * Fetch roles assigned to a group.
 */
export function useGroupRolesQuery(groupId: string, options?: { enabled?: boolean; limit?: number }) {
  return useQuery({
    queryKey: groupsKeys.roles(groupId),
    queryFn: async () => {
      const response = await groupsApi.listRolesForGroup({
        uuid: groupId,
        limit: options?.limit ?? 1000,
      });
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!groupId,
  });
}

/**
 * Fetch service accounts in a group.
 * Note: Uses getPrincipalsFromGroup with serviceAccountClientIds filter.
 */
export function useGroupServiceAccountsQuery(groupId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: groupsKeys.serviceAccounts(groupId),
    queryFn: async () => {
      // The API returns both users and service accounts based on query params
      // For service accounts, we need to use principalType=service-account
      const response = await groupsApi.getPrincipalsFromGroup({
        uuid: groupId,
        principalType: 'service-account',
      } as any); // Type assertion needed due to rbac-client type issues
      return response.data;
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

// Re-export types from API layer
export type { Group, GroupOut, ListGroupsParams, GroupWithPrincipals, GroupWithPrincipalsAndRoles } from '../api/groups';
