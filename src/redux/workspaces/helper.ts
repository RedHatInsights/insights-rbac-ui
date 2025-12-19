import { WorkspacesDeleteParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesDelete';
import { WorkspacesListParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesList';
import { WorkspacesPatchParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesPatch';
import { WorkspaceCreateBody } from './reducer';
import { RoleBindingsPaginatedResponse, getWorkspacesApi } from './api';
import { WorkspacesMoveParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesMove';
import { RoleBindingsListBySubjectParams } from '@redhat-cloud-services/rbac-client/v2/RoleBindingsListBySubject';

const workspacesApi = getWorkspacesApi();

export async function getWorkspaces(config: WorkspacesListParams = {}) {
  return workspacesApi.listWorkspaces({
    limit: config.limit ?? 10000,
    offset: config.offset ?? 0,
    type: config.type ?? 'all',
    name: config.name,
    options: config.options,
  });
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

export async function getRoleBindingsForSubject(config: RoleBindingsListBySubjectParams): Promise<RoleBindingsPaginatedResponse> {
  // The responseDataInterceptor unwraps the AxiosResponse, so we cast to the expected type
  return workspacesApi.roleBindingsListBySubject({
    resourceId: config.resourceId,
    resourceType: config.resourceType,
    limit: config.limit ?? 10000,
    cursor: config.cursor,
    subjectType: config.subjectType,
    subjectId: config.subjectId,
    parentRoleBindings: config.parentRoleBindings,
    fields: config.fields,
    orderBy: config.orderBy,
    options: config.options,
  }) as unknown as Promise<RoleBindingsPaginatedResponse>;
}
