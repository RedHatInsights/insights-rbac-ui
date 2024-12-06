import { WorkspaceCreateBody } from '../../redux/reducers/workspaces-reducer';
import { getWorkspacesApi } from './api';

const workspacesApi = getWorkspacesApi();

export async function getWorkspaces() {
  return await workspacesApi.listWorkspaces();
}

export async function getWorkspace(ws: string) {
  return await workspacesApi.getWorkspace({ id: ws });
}

export async function createWorkspace(config: WorkspaceCreateBody) {
  return await workspacesApi.createWorkspace(config);
}
