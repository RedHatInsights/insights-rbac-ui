import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { type RoleBindingsListBySubjectParams, type WorkspacesListParams, type WorkspacesPatchParams, workspacesApi } from '../api/workspaces';
import messages from '../../Messages';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const workspacesKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspacesKeys.all, 'list'] as const,
  list: (params: WorkspacesListParams) => [...workspacesKeys.lists(), params] as const,
  details: () => [...workspacesKeys.all, 'detail'] as const,
  detail: (id: string) => [...workspacesKeys.details(), id] as const,
};

export const roleBindingsKeys = {
  all: ['roleBindings'] as const,
  bySubject: () => [...roleBindingsKeys.all, 'bySubject'] as const,
  bySubjectParams: (params: RoleBindingsListBySubjectParams) => [...roleBindingsKeys.bySubject(), params] as const,
  forWorkspace: (workspaceId: string) => [...roleBindingsKeys.all, 'workspace', workspaceId] as const,
  forGroup: (groupId: string) => [...roleBindingsKeys.all, 'group', groupId] as const,
  forUser: (userId: string) => [...roleBindingsKeys.all, 'user', userId] as const,
};

// ============================================================================
// Workspace Query Hooks
// ============================================================================

/**
 * Fetch a paginated list of workspaces.
 */
export function useWorkspacesQuery(params: WorkspacesListParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: workspacesKeys.list(params),
    queryFn: async () => {
      const response = await workspacesApi.listWorkspaces({
        limit: params.limit ?? 1000,
        offset: params.offset ?? 0,
        type: params.type ?? 'all',
        name: params.name,
      });
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch a single workspace by ID.
 */
export function useWorkspaceQuery(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: workspacesKeys.detail(id),
    queryFn: async () => {
      const response = await workspacesApi.getWorkspace({ id });
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!id,
  });
}

// ============================================================================
// Role Bindings Query Hooks
// ============================================================================

/**
 * Fetch role bindings for a specific resource (e.g., workspace).
 * This is the main hook for querying access assignments.
 *
 * NOTE: The V2 API requires resourceId and resourceType as required parameters.
 * This means you cannot query "all role bindings for a user across all workspaces"
 * directly - you need to specify which resource to check.
 */
export function useRoleBindingsQuery(params: RoleBindingsListBySubjectParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: roleBindingsKeys.bySubjectParams(params),
    queryFn: async () => {
      const response = await workspacesApi.roleBindingsListBySubject({
        resourceId: params.resourceId,
        resourceType: params.resourceType,
        limit: params.limit ?? 1000,
        cursor: params.cursor,
        subjectType: params.subjectType,
        subjectId: params.subjectId,
        parentRoleBindings: params.parentRoleBindings,
        fields: params.fields,
        orderBy: params.orderBy,
      });
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!params.resourceId && !!params.resourceType,
  });
}

/**
 * Fetch role bindings for a workspace, filtered by groups.
 * Useful for showing which groups have access to a workspace.
 */
export function useWorkspaceGroupBindingsQuery(workspaceId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: roleBindingsKeys.forWorkspace(workspaceId),
    queryFn: async () => {
      const response = await workspacesApi.roleBindingsListBySubject({
        resourceId: workspaceId,
        resourceType: 'workspace',
        subjectType: 'group',
        limit: 1000,
      });
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!workspaceId,
  });
}

// ============================================================================
// Workspace Mutation Hooks
// ============================================================================

interface CreateWorkspaceParams {
  name: string;
  description?: string;
  parent_id?: string;
}

/**
 * Create a new workspace.
 */
export function useCreateWorkspaceMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async (params: CreateWorkspaceParams) => {
      const response = await workspacesApi.createWorkspace({
        workspacesCreateWorkspaceRequest: {
          name: params.name,
          description: params.description,
          parent_id: params.parent_id,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.all });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.createWorkspaceSuccessTitle),
        dismissable: true,
      });
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.addGroupMemberErrorTitle), // Generic error
        dismissable: true,
      });
    },
  });
}

/**
 * Update (patch) an existing workspace.
 */
export function useUpdateWorkspaceMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async (params: WorkspacesPatchParams) => {
      const response = await workspacesApi.updateWorkspace(params);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.all });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.editWorkspaceSuccessTitle),
        dismissable: true,
      });
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.addGroupMemberErrorTitle), // Generic error
        dismissable: true,
      });
    },
  });
}

/**
 * Delete a workspace.
 */
export function useDeleteWorkspaceMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async (id: string) => {
      await workspacesApi.deleteWorkspace({ id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.all });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.deleteWorkspaceSuccessTitle),
        dismissable: true,
      });
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.addGroupMemberErrorTitle), // Generic error
        dismissable: true,
      });
    },
  });
}

// Re-export types
export type { WorkspacesListParams, RoleBindingsListBySubjectParams } from '../api/workspaces';
export type {
  WorkspacesWorkspace,
  WorkspacesWorkspaceListResponse,
  RoleBindingsRoleBindingBySubject,
  RoleBindingsRoleBindingBySubjectListResponse,
  RoleBindingsRole,
} from '../api/workspaces';
