import { useMutation, useQuery } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import {
  type RoleBindingsListBySubjectParams,
  type WorkspacesListParams,
  type WorkspacesPatchParams,
  type WorkspacesWorkspace,
  createWorkspacesApi,
} from '../api/workspaces';
import { useAppServices } from '../../contexts/ServiceContext';
import messages from '../../Messages';
import { useMutationQueryClient } from './utils';
import { type MutationOptions, type QueryOptions } from './types';

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
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useWorkspacesQuery(params: WorkspacesListParams = {}, options?: QueryOptions) {
  const { axios } = useAppServices();
  const workspacesApi = createWorkspacesApi(axios);

  return useQuery(
    {
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
    },
    options?.queryClient,
  );
}

/**
 * Fetch a single workspace by ID.
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useWorkspaceQuery(id: string, options?: QueryOptions) {
  const { axios } = useAppServices();
  const workspacesApi = createWorkspacesApi(axios);

  return useQuery(
    {
      queryKey: workspacesKeys.detail(id),
      queryFn: async () => {
        const response = await workspacesApi.getWorkspace({ id });
        return response.data;
      },
      enabled: (options?.enabled ?? true) && !!id,
    },
    options?.queryClient,
  );
}

// ============================================================================
// Role Bindings Query Hooks
// ============================================================================

/**
 * Fetch role bindings for a specific resource (e.g., workspace).
 * This is the main hook for querying access assignments.
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 */
export function useRoleBindingsQuery(params: RoleBindingsListBySubjectParams, options?: { enabled?: boolean }) {
  const { axios } = useAppServices();
  const workspacesApi = createWorkspacesApi(axios);

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
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 */
export function useWorkspaceGroupBindingsQuery(workspaceId: string, options?: QueryOptions) {
  const { axios } = useAppServices();
  const workspacesApi = createWorkspacesApi(axios);

  return useQuery(
    {
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
    },
    options?.queryClient,
  );
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
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useCreateWorkspaceMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const workspacesApi = createWorkspacesApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: async (params: CreateWorkspaceParams) => {
        const response = await workspacesApi.createWorkspace({
          workspacesCreateWorkspaceRequest: {
            name: params.name,
            ...(params.description && { description: params.description }),
            parent_id: params.parent_id,
          },
        });
        return response.data;
      },
      onSuccess: (_, variables) => {
        qc.invalidateQueries({ queryKey: workspacesKeys.all });
        notify('success', intl.formatMessage(messages.createWorkspaceSuccessTitle, { name: variables.name }));
      },
      onError: (error: Error, variables) => {
        notify(
          'danger',
          intl.formatMessage(messages.createWorkspaceErrorTitle, { name: variables.name }),
          error.message || intl.formatMessage(messages.createWorkspaceErrorDescription),
        );
      },
    },
    options?.queryClient,
  );
}

/**
 * Update (patch) an existing workspace.
 * Uses injected services from ServiceContext - works in both browser and CLI.
 */
/**
 * Update a workspace.
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useUpdateWorkspaceMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const workspacesApi = createWorkspacesApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: async (params: WorkspacesPatchParams) => {
        const response = await workspacesApi.updateWorkspace(params);
        return response.data;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: workspacesKeys.all });
        notify('success', intl.formatMessage(messages.editWorkspaceSuccessTitle), intl.formatMessage(messages.editWorkspaceSuccessDescription));
      },
      onError: () => {
        notify('danger', intl.formatMessage(messages.editWorkspaceErrorTitle), intl.formatMessage(messages.editWorkspaceErrorDescription));
      },
    },
    options?.queryClient,
  );
}

/**
 * Delete a workspace.
 * Uses injected services from ServiceContext - works in both browser and CLI.
 * For CLI, pass { queryClient } to bypass context.
 */
export function useDeleteWorkspaceMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const workspacesApi = createWorkspacesApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: async ({ id, name }: { id: string; name?: string }) => {
        await workspacesApi.deleteWorkspace({ id });
        return { id, name };
      },
      onSuccess: (_, variables) => {
        qc.invalidateQueries({ queryKey: workspacesKeys.all });
        notify(
          'success',
          intl.formatMessage(messages.deleteWorkspaceSuccessTitle),
          variables.name ? intl.formatMessage(messages.deleteWorkspaceSuccessDescription, { workspace: variables.name }) : undefined,
        );
      },
      onError: (_, variables) => {
        notify(
          'danger',
          intl.formatMessage(messages.deleteWorkspaceErrorTitle),
          variables.name ? intl.formatMessage(messages.deleteWorkspaceErrorDescription, { workspace: variables.name }) : undefined,
        );
      },
    },
    options?.queryClient,
  );
}

interface MoveWorkspaceParams {
  id: string;
  parent_id: string;
  name?: string; // For notification message
}

/**
 * Move a workspace to a new parent.
 * Uses injected services from ServiceContext - works in both browser and CLI.
 */
export function useMoveWorkspaceMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const workspacesApi = createWorkspacesApi(axios);
  const queryClient = useMutationQueryClient(options?.queryClient);
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
      notify(
        'success',
        intl.formatMessage(messages.moveWorkspaceSuccessTitle),
        variables.name ? intl.formatMessage(messages.moveWorkspaceSuccessDescription, { name: variables.name }) : undefined,
      );
    },
    onError: (_, variables) => {
      notify(
        'danger',
        intl.formatMessage(messages.moveWorkspaceErrorTitle, { name: variables.name ?? '' }),
        variables.name ? intl.formatMessage(messages.moveWorkspaceErrorDescription, { workspace: variables.name }) : undefined,
      );
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
  RoleBindingsListBySubject200Response,
  RoleBindingsRole,
  RoleBindingsRoleBindingBySubjectSubject,
  RoleBindingsResource,
} from '../api/workspaces';
