import { getWorkspacesApi } from './api';

const workspacesApi = getWorkspacesApi();

export async function getWorkspaces() {
  return await workspacesApi.listWorkspaces();
}

export async function getWorkspace(ws: string) {
  return await workspacesApi.getWorkspace({ id: ws });
}
