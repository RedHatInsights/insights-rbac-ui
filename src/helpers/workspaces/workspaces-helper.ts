import { WorkspacesListParams } from '@redhat-cloud-services/rbac-client/dist/v2/WorkspacesList';
import { WorkspaceCreateBody } from '../../redux/reducers/workspaces-reducer';
import { getWorkspacesApi } from './api';
import { WorkspacesPatchParams } from '@redhat-cloud-services/rbac-client/dist/v2/WorkspacesPatch';

const workspacesApi = getWorkspacesApi();

export async function getWorkspaces(config: WorkspacesListParams = {}) {
  return await workspacesApi.listWorkspaces({ limit: 100, ...config });
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
