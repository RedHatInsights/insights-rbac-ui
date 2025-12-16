import { WorkspacesDeleteParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesDelete';
import { WorkspacesListParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesList';
import { WorkspacesPatchParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesPatch';
import { WorkspaceCreateBody } from './reducer';
import { getWorkspacesApi } from './api';
import { WorkspacesMoveParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesMove';
import { RoleBindingsListBySubjectParams } from '@redhat-cloud-services/rbac-client/v2/RoleBindingsListBySubject';

const workspacesApi = getWorkspacesApi();

export async function getWorkspaces(config: WorkspacesListParams = {}) {
  return workspacesApi.listWorkspaces(config.limit ?? 10000, config.offset ?? 0, config.type ?? 'all', config.name ?? '', config.options ?? {});
}

export async function getWorkspace(workspaceId: string) {
  return workspacesApi.getWorkspace(workspaceId, false, {});
}

export async function createWorkspace(config: WorkspaceCreateBody) {
  return workspacesApi.createWorkspace(config, {});
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

export async function getRoleBindingsForSubject(config: RoleBindingsListBySubjectParams) {
  return workspacesApi.roleBindingsListBySubject(
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
}
