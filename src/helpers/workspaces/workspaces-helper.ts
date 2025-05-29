import { WorkspacesDeleteParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesDelete';
import { WorkspacesListParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesList';
import { WorkspacesPatchParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesPatch';
import { WorkspaceCreateBody } from '../../redux/reducers/workspaces-reducer';
import { getWorkspacesApi } from './api';

const workspacesApi = getWorkspacesApi();

export async function getWorkspaces(config: WorkspacesListParams = {}) {
  return await workspacesApi.listWorkspaces({ limit: 10000, ...config });
}

export async function getWorkspace(workspaceId: string) {
  return workspacesApi.getWorkspace({ id: workspaceId });
}

export async function createWorkspace(config: WorkspaceCreateBody) {
  return workspacesApi.createWorkspace({
    workspacesCreateWorkspaceRequest: {
      parent_id: config.parent_id,
      name: config.name,
      description: config.description,
    },
  });
}

export async function updateWorkspace(config: WorkspacesPatchParams) {
  return workspacesApi.updateWorkspace(config);
}

export async function deleteWorkspace(config: WorkspacesDeleteParams) {
  return workspacesApi.deleteWorkspace(config);
}
