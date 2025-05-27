import { WorkspacesListParams } from '@redhat-cloud-services/rbac-client/dist/v2/WorkspacesList';
import { WorkspaceCreateBody } from '../../redux/reducers/workspaces-reducer';
import { getWorkspacesApi } from './api';
import { WorkspacesPatchParams } from '@redhat-cloud-services/rbac-client/dist/v2/WorkspacesPatch';
import { WorkspacesDeleteParams } from '@redhat-cloud-services/rbac-client/dist/v2/WorkspacesDelete';

const workspacesApi = getWorkspacesApi();

export async function getWorkspaces(config: WorkspacesListParams = {}) {
  return await workspacesApi.listWorkspaces({ limit: 10000, ...config });
}

export async function getWorkspace(workspaceId: string) {
  return await workspacesApi.getWorkspace(workspaceId);
}

export async function createWorkspace(config: WorkspaceCreateBody) {
  return await workspacesApi.createWorkspace(config);
}

export async function updateWorkspace(config: WorkspacesPatchParams) {
  return await workspacesApi.updateWorkspace(config.uuid, config.workspacesPatchWorkspaceRequest);
}

export async function deleteWorkspace(config: WorkspacesDeleteParams) {
  return await workspacesApi.deleteWorkspace(config.uuid);
}
