import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import type { AxiosInstance } from 'axios';
import listWorkspaces from '@redhat-cloud-services/rbac-client/v2/WorkspacesList';
import getWorkspace from '@redhat-cloud-services/rbac-client/v2/WorkspacesRead';
import createWorkspace from '@redhat-cloud-services/rbac-client/v2/WorkspacesCreate';
import updateWorkspace from '@redhat-cloud-services/rbac-client/v2/WorkspacesPatch';
import deleteWorkspace from '@redhat-cloud-services/rbac-client/v2/WorkspacesDelete';
import moveWorkspace from '@redhat-cloud-services/rbac-client/v2/WorkspacesMove';
import roleBindingsListBySubject from '@redhat-cloud-services/rbac-client/v2/RoleBindingsListBySubject';
import { RBAC_API_BASE_2, apiClient } from './client';

// Bundle workspace endpoints
const workspaceEndpoints = {
  listWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  moveWorkspace,
  roleBindingsListBySubject,
};

/**
 * Type for the Workspaces API client returned by APIFactory.
 */
export type WorkspacesApiClient = ReturnType<typeof APIFactory<typeof workspaceEndpoints>>;

/**
 * Create a Workspaces API client with a custom axios instance.
 * Use this for dependency injection in shared hooks.
 *
 * @param axios - Custom axios instance (e.g., from ServiceContext)
 * @returns Fully typed Workspaces API client
 */
export function createWorkspacesApi(axios: AxiosInstance): WorkspacesApiClient {
  return APIFactory(RBAC_API_BASE_2, workspaceEndpoints, { axios });
}

/**
 * Default Workspaces API client - uses the browser apiClient.
 * For shared hooks, prefer createWorkspacesApi() with injected axios.
 */
export const workspacesApi = createWorkspacesApi(apiClient);

// Re-export types
export type { WorkspacesListParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesList';
export type { WorkspacesReadParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesRead';
export type { WorkspacesCreateParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesCreate';
export type { WorkspacesPatchParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesPatch';
export type { WorkspacesDeleteParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesDelete';
export type { WorkspacesMoveParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesMove';
export type { RoleBindingsListBySubjectParams } from '@redhat-cloud-services/rbac-client/v2/RoleBindingsListBySubject';
export type {
  WorkspacesWorkspace,
  WorkspacesWorkspaceListResponse,
  RoleBindingsRoleBindingBySubject,
  RoleBindingsListBySubject200Response,
  RoleBindingsRole,
  RoleBindingsRoleBindingBySubjectSubject,
  RoleBindingsResource,
} from '@redhat-cloud-services/rbac-client/v2/types';
