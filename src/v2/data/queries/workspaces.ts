import { useMutation, useQuery } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import {
  type RoleBindingsBindingSubjectType,
  type RoleBindingsListBySubjectParams,
  type WorkspacesListParams,
  type WorkspacesPatchParams,
  type WorkspacesWorkspace,
  createWorkspacesApi,
} from '../api/workspaces';
import { useAppServices } from '../../../shared/contexts/ServiceContext';

import { useMutationQueryClient } from '../../../shared/data/utils';
import { type MutationOptions, type QueryOptions } from '../../../shared/data/types';

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
  orgGroups: (orgId: string) => [...roleBindingsKeys.all, 'org', orgId] as const,
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
          limit: Math.min(params.limit ?? 1000, 1000),
          offset: params.offset ?? 0,
          type: params.type ?? 'all',
          name: params.name,
          orderBy: params.orderBy,
          withAncestry: true,
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
        excludeSources: params.excludeSources,
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
        if (options?.deferSuccessSideEffects) return;
        qc.invalidateQueries({ queryKey: workspacesKeys.all });
        notify(
          'success',
          intl.formatMessage(
            {
              id: 'createWorkspaceSuccessTitle',
              defaultMessage: 'New {name} workspace has been successfully created',
              description: 'Create workspace success notification title',
            },
            { name: variables.name },
          ),
        );
      },
      onError: (error: Error, variables) => {
        notify(
          'danger',
          intl.formatMessage(
            {
              id: 'createWorkspaceErrorTitle',
              defaultMessage: 'Failed creating {name} workspace',
              description: 'Create workspace error notification title',
            },
            { name: variables.name },
          ),
          error.message ||
            intl.formatMessage({
              id: 'createWorkspaceErrorDescription',
              defaultMessage: 'The workspace was not created successfuly.',
              description: 'Create workspace error notification description',
            }),
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
        notify(
          'success',
          intl.formatMessage({
            id: 'editWorkspaceSuccessTitle',
            defaultMessage: 'Success updating workspace',
            description: 'Update workspace success notification title',
          }),
          intl.formatMessage({
            id: 'editWorkspaceSuccessDescription',
            defaultMessage: 'The workspace was updated successfully.',
            description: 'Update workspace success notification description',
          }),
        );
      },
      onError: () => {
        notify(
          'danger',
          intl.formatMessage({
            id: 'editWorkspaceErrorTitle',
            defaultMessage: 'Error updating workspace',
            description: 'Update workspace error notification title',
          }),
          intl.formatMessage({
            id: 'editWorkspaceErrorDescription',
            defaultMessage: 'The workspace was not updated successfully.',
            description: 'Update workspace error notification description',
          }),
        );
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
          intl.formatMessage({
            id: 'deleteWorkspaceSuccessTitle',
            defaultMessage: 'Success deleting workspace',
            description: 'Delete workspace success notification title',
          }),
          variables.name
            ? intl.formatMessage(
                {
                  id: 'deleteWorkspaceSuccessDescription',
                  defaultMessage: 'The workspace {workspace} was deleted successfully.',
                  description: 'Delete workspace success notification description',
                },
                { workspace: variables.name },
              )
            : undefined,
        );
      },
      onError: (_, variables) => {
        notify(
          'danger',
          intl.formatMessage({
            id: 'deleteWorkspaceErrorTitle',
            defaultMessage: 'Failed deleting workspace',
            description: 'Delete workspace error notification title',
          }),
          variables.name
            ? intl.formatMessage(
                {
                  id: 'deleteWorkspaceErrorDescription',
                  defaultMessage: 'The workspace {workspace} was not deleted successfuly.',
                  description: 'Delete workspace error notification description',
                },
                { workspace: variables.name },
              )
            : undefined,
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
        intl.formatMessage({
          id: 'moveWorkspaceSuccessTitle',
          defaultMessage: 'Moving workspace',
          description: 'Move workspace success notification title',
        }),
        variables.name
          ? intl.formatMessage(
              {
                id: 'moveWorkspaceSuccessDescription',
                defaultMessage: '{name} has been moved successfully.',
                description: 'Move workspace success notification description',
              },
              { name: variables.name },
            )
          : undefined,
      );
    },
    onError: (_, variables) => {
      notify(
        'danger',
        intl.formatMessage(
          { id: 'moveWorkspaceErrorTitle', defaultMessage: 'Failed to move {name}', description: 'Move workspace error notification title' },
          { name: variables.name ?? '' },
        ),
        variables.name
          ? intl.formatMessage(
              {
                id: 'moveWorkspaceErrorDescription',
                defaultMessage: '{workspace} was not moved successfully.',
                description: 'Move workspace error notification description',
              },
              { workspace: variables.name },
            )
          : undefined,
      );
    },
  });
}

// ============================================================================
// Group Access Mutation Hooks
// ============================================================================

interface UpdateGroupRolesParams {
  resourceId: string;
  resourceType: 'workspace' | 'tenant';
  subjectId: string;
  subjectType: RoleBindingsBindingSubjectType;
  roleIds: string[];
}

/**
 * Replace all roles for a group in a workspace (or other resource).
 * Uses injected services from ServiceContext - works in both browser and CLI.
 */
export function useUpdateGroupRolesMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const workspacesApi = createWorkspacesApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: async ({ resourceId, resourceType, subjectId, subjectType, roleIds }: UpdateGroupRolesParams) => {
        const response = await workspacesApi.roleBindingsUpdate({
          resourceId,
          resourceType,
          subjectId,
          subjectType,
          roleBindingsUpdateRoleBindingsRequest: {
            roles: roleIds.map((id) => ({ id })),
          },
        });
        return response.data;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: roleBindingsKeys.all });
        notify(
          'success',
          intl.formatMessage({
            id: 'updateRoleBindingsSuccessTitle',
            defaultMessage: 'Access updated successfully',
            description: 'Success notification title when role bindings are updated',
          }),
        );
      },
      onError: (error: Error) => {
        notify(
          'danger',
          intl.formatMessage({
            id: 'updateRoleBindingsErrorTitle',
            defaultMessage: 'Failed to update access',
            description: 'Error notification title when role bindings update fails',
          }),
          error.message ||
            intl.formatMessage({
              id: 'updateRoleBindingsErrorDescription',
              defaultMessage: 'There was a problem saving the role changes. Please try again.',
              description: 'Error notification description when role bindings update fails',
            }),
        );
      },
    },
    options?.queryClient,
  );
}

/**
 * Grant access to a workspace by assigning roles to groups.
 * Used by the Grant Access wizard.
 */
export function useGrantAccessMutation(options?: MutationOptions) {
  const { axios, notify } = useAppServices();
  const workspacesApi = createWorkspacesApi(axios);
  const qc = useMutationQueryClient(options?.queryClient);
  const intl = useIntl();

  return useMutation(
    {
      mutationFn: async ({
        workspaceId,
        groupIds,
        roleIds,
        resourceType = 'workspace',
      }: {
        workspaceId: string;
        groupIds: string[];
        roleIds: string[];
        resourceType?: 'workspace' | 'tenant';
      }) => {
        const requests = groupIds.flatMap((groupId) =>
          roleIds.map((roleId) => ({
            resource: { id: workspaceId, type: resourceType },
            subject: { id: groupId, type: 'group' as const },
            role: { id: roleId },
          })),
        );
        const response = await workspacesApi.roleBindingsBatchCreate({
          roleBindingsBatchCreateRoleBindingsRequest: { requests },
        });
        return response.data;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: roleBindingsKeys.all });
        qc.invalidateQueries({ queryKey: workspacesKeys.all });
        notify(
          'success',
          intl.formatMessage({
            id: 'grantAccessSuccessTitle',
            defaultMessage: 'Access granted successfully',
            description: 'Success notification title when access is granted',
          }),
          intl.formatMessage({
            id: 'grantAccessSuccessDescription',
            defaultMessage: 'Role bindings were created for the selected groups.',
            description: 'Success notification description when access is granted',
          }),
        );
      },
      onError: (error: Error) => {
        notify(
          'danger',
          intl.formatMessage({
            id: 'grantAccessErrorTitle',
            defaultMessage: 'Failed to grant access',
            description: 'Error notification title when granting access fails',
          }),
          error.message ||
            intl.formatMessage({
              id: 'grantAccessErrorDescription',
              defaultMessage: 'There was a problem granting access. Please try again.',
              description: 'Error notification description when granting access fails',
            }),
        );
      },
    },
    options?.queryClient,
  );
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a WorkspacesWorkspace.
 */
export function isWorkspace(data: unknown): data is WorkspacesWorkspace {
  if (typeof data !== 'object' || data === null) return false;
  if (!('id' in data) || !('name' in data)) return false;
  return typeof data.id === 'string' && typeof data.name === 'string';
}

// ============================================================================
// Workspace Permission Types
// ============================================================================

/** All Kessel workspace relations we check */
export const WORKSPACE_RELATIONS = ['view', 'edit', 'delete', 'create', 'move'] as const;

/** A single Kessel workspace relation */
export type WorkspaceRelation = (typeof WORKSPACE_RELATIONS)[number];

/** Resolved permissions for a single workspace (all relations) */
export type WorkspacePermissions = Record<WorkspaceRelation, boolean>;

/** Default empty permissions object (all denied) */
export const EMPTY_PERMISSIONS: WorkspacePermissions = {
  view: false,
  edit: false,
  delete: false,
  create: false,
  move: false,
};

/** Workspace enriched with per-resource Kessel permissions */
export interface WorkspaceWithPermissions extends WorkspacesWorkspace {
  permissions: WorkspacePermissions;
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
  RoleBindingsRoleBinding,
  RoleBindingsRoleBindingBySubjectSubject,
  RoleBindingsResource,
  RoleBindingsBatchCreateRoleBindingsRequest,
  RoleBindingsBatchCreateRoleBindingsResponse,
  RoleBindingsCreateRoleBindingsRequest,
  RoleBindingsList200Response,
  RoleBindingsGroupSubject,
  RoleBindingsGroupDetails,
  RoleBindingsUserSubject,
  RoleBindingsUserDetails,
  Role,
} from '../api/workspaces';
