import { WorkspacesDeleteParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesDelete';
import { WorkspacesListParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesList';
import { WorkspacesPatchParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesPatch';
import { WorkspaceCreateBody } from './reducer';
import { getWorkspacesApi } from './api';
import { WorkspacesMoveParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesMove';

const workspacesApi = getWorkspacesApi();

export async function getWorkspaces(config: WorkspacesListParams = {}) {
  return workspacesApi.listWorkspaces(config.limit ?? 10000, config.offset ?? 0, config.type ?? 'all', config.name ?? '', config.options ?? {});
}

export async function getWorkspace(workspaceId: string) {
  return workspacesApi.getWorkspace(workspaceId, false, {});
}

export async function createWorkspace(config: WorkspaceCreateBody) {
  return workspacesApi.createWorkspace(
    {
      parent_id: config.parent_id,
      name: config.name,
      description: config.description,
    },
    {},
  );
}

export async function updateWorkspace(config: WorkspacesPatchParams) {
  return workspacesApi.updateWorkspace(config.id, config.workspacesPatchWorkspaceRequest, {});
}

export async function deleteWorkspace(config: WorkspacesDeleteParams) {
  return workspacesApi.deleteWorkspace(config.id, {});
}

export async function moveWorkspace(config: WorkspacesMoveParams) {
  return workspacesApi.moveWorkspaces(config.id, config.workspacesMoveWorkspaceRequest, {});
}
