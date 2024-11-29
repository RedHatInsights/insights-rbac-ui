import { getWorkspacesApi } from './api';
import { WorkspacesBasicWorkspace } from '@redhat-cloud-services/rbac-client/dist/v2/types';

const workspacesApi = getWorkspacesApi();

export async function getWorkspaces() {
  return await workspacesApi.listWorkspaces();
}

export async function getWorkspace(ws: string) {
  return await workspacesApi.getWorkspace({ id: ws });
}

export async function createWorkspace(config: WorkspacesBasicWorkspace) {
  return await workspacesApi.createWorkspace({ ...config, parent_id: 'default' });
}
