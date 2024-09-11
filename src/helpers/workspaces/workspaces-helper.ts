import { getWorkspacesApi } from './api';

const workspacesApi = getWorkspacesApi();

export async function getWorkspaces() {
  return await workspacesApi.listWorkspaces();
}
