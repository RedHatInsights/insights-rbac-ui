import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import {
  type RoleBindingsListBySubjectParams,
  type WorkspacesListParams,
  type WorkspacesPatchParams,
  type WorkspacesWorkspace,
  workspacesApi,
} from '../api/workspaces';
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.all });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.createWorkspaceSuccessTitle, { name: variables.name }),
        dismissable: true,
      });
    },
    onError: (error: Error, variables) => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.createWorkspaceErrorTitle, { name: variables.name }),
        description: error.message || intl.formatMessage(messages.createWorkspaceErrorDescription),
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
        description: intl.formatMessage(messages.editWorkspaceSuccessDescription),
        dismissable: true,
      });
    },
    onError: () => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.editWorkspaceErrorTitle),
        description: intl.formatMessage(messages.editWorkspaceErrorDescription),
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
    mutationFn: async ({ id, name }: { id: string; name?: string }) => {
      await workspacesApi.deleteWorkspace({ id });
      return { id, name };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.all });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.deleteWorkspaceSuccessTitle),
        description: variables.name ? intl.formatMessage(messages.deleteWorkspaceSuccessDescription, { workspace: variables.name }) : undefined,
        dismissable: true,
      });
    },
    onError: (_, variables) => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.deleteWorkspaceErrorTitle),
        description: variables.name ? intl.formatMessage(messages.deleteWorkspaceErrorDescription, { workspace: variables.name }) : undefined,
        dismissable: true,
      });
    },
  });
}

interface MoveWorkspaceParams {
  id: string;
  parent_id: string;
  name?: string; // For notification message
}

/**
 * Move a workspace to a new parent.
 */
export function useMoveWorkspaceMutation() {
  const queryClient = useQueryClient();
  const addNotification = useAddNotification();
  const intl = useIntl();

  return useMutation({
    mutationFn: async ({ id, parent_id }: MoveWorkspaceParams) => {
      const response = await workspacesApi.moveWorkspace({
        id,
        workspacesMoveWorkspaceRequest: { parent_id },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspacesKeys.all });
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.moveWorkspaceSuccessTitle),
        description: variables.name ? intl.formatMessage(messages.moveWorkspaceSuccessDescription, { name: variables.name }) : undefined,
        dismissable: true,
      });
    },
    onError: (_, variables) => {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.moveWorkspaceErrorTitle, { name: variables.name ?? '' }),
        description: variables.name ? intl.formatMessage(messages.moveWorkspaceErrorDescription, { workspace: variables.name }) : undefined,
        dismissable: true,
      });
    },
  });
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a WorkspacesWorkspace.
 */
export function isWorkspace(data: unknown): data is WorkspacesWorkspace {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as WorkspacesWorkspace).id === 'string' &&
    typeof (data as WorkspacesWorkspace).name === 'string'
  );
}

// ============================================================================
// Re-export API types for convenience
// ============================================================================

export type {
  WorkspacesListParams,
  WorkspacesPatchParams,
  RoleBindingsListBySubjectParams,
  WorkspacesWorkspace,
  WorkspacesWorkspaceListResponse,
  RoleBindingsRoleBindingBySubject,
  RoleBindingsRoleBindingBySubjectListResponse,
  RoleBindingsRole,
  RoleBindingsRoleBindingBySubjectSubject,
  RoleBindingsResource,
} from '../api/workspaces';
