import { WorkspacesDeleteParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesDelete';
import { WorkspacesListParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesList';
import { WorkspacesPatchParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesPatch';
import { WorkspaceCreateBody } from './reducer';
import { getWorkspacesApi } from './api';
import { WorkspacesMoveParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesMove';
import { RoleBindingsListBySubjectParams } from '@redhat-cloud-services/rbac-client/v2/RoleBindingsListBySubject';

const workspacesApi = getWorkspacesApi();

export async function getWorkspaces(config: WorkspacesListParams = {}) {
  const response = await workspacesApi.listWorkspaces(
    config.limit ?? 10000,
    config.offset ?? 0,
    config.type ?? 'all',
    config.name ?? '',
    config.options ?? {},
  );
  return response.data;
}

export async function getWorkspace(workspaceId: string) {
  const response = await workspacesApi.getWorkspace(workspaceId, false, {});
  return response.data;
}

export async function createWorkspace(config: WorkspaceCreateBody) {
  const response = await workspacesApi.createWorkspace(config, {});
  return response.data;
}

export async function updateWorkspace(config: WorkspacesPatchParams) {
  const response = await workspacesApi.updateWorkspace(config.id, config.workspacesPatchWorkspaceRequest, {});
  return response.data;
}

export async function deleteWorkspace(config: WorkspacesDeleteParams) {
  const response = await workspacesApi.deleteWorkspace(config.id, {});
  return response.data;
}

export async function moveWorkspace(config: WorkspacesMoveParams) {
  const response = await workspacesApi.moveWorkspaces(config.id, config.workspacesMoveWorkspaceRequest, {});
  return response.data;
}

export async function getRoleBindingsForSubject(config: RoleBindingsListBySubjectParams) {
  const response = await workspacesApi.roleBindingsListBySubject(
    config.resourceId,
    config.resourceType,
    config.limit ?? 10000,
    config.cursor ?? '',
    config.subjectType ?? '',
    config.subjectId ?? '',
    config.parentRoleBindings ?? false,
    config.fields ?? '',
    config.orderBy ?? '',
    config.options ?? {},
  );
  return response.data;
}
