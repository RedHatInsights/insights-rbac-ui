import { WorkspacesDeleteParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesDelete';
import { WorkspacesListParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesList';
import { WorkspacesPatchParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesPatch';
import { WorkspaceCreateBody } from './reducer';
import { getWorkspacesApi } from './api';
import { WorkspacesMoveParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesMove';
import { RoleBindingsListBySubjectParams } from '@redhat-cloud-services/rbac-client/v2/RoleBindingsListBySubject';
import { getGroupApi } from '../../api/groupApi';

const workspacesApi = getWorkspacesApi();

export async function getWorkspaces(config: WorkspacesListParams = {}) {
  return workspacesApi.listWorkspaces(config.limit ?? 10000, config.offset ?? 0, '', config.type ?? 'all', config.name ?? '', config.options ?? {});
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getRoleBindingsForSubject(config: RoleBindingsListBySubjectParams) {
  // return workspacesApi.roleBindingsListBySubject(
  //   config.limit ?? 10000,
  //   config.orderBy ?? '',
  //   config.cursor ?? '',
  //   config.resourceType ?? '',
  //   config.resourceId ?? '',
  //   config.subjectType ?? '',
  //   config.subjectId ?? '',
  //   config.fields ?? '',
  //   config.options ?? {},
  // );
  // Mocking until backend is ready
  const groups = await getGroupApi().listGroups({});
  const { data, ...rest } = groups;
  return {
    data: data.map(({ uuid, name, description }) => ({
      last_modified: '2024-08-24T15:45:00Z',
      subject: {
        id: uuid,
        type: 'group',
        group: {
          name: name,
          description: description,
          user_count: 15,
        },
      },
      roles: [
        {
          id: '4b1a7d6e-8f1c-4b3a-9e2c-1d8f7e6a12b3',
          name: 'Viewer',
        },
      ],
      resource: {
        id: 'e2d3c1a4-9b8f-4d6e-a7c1-2f8e7d6c5b9a',
        type: 'workspace',
        workspace: {
          name: 'Marketing Assets',
          type: 'standard',
          description: 'Workspace for marketing materials.',
        },
      },
    })),
    ...rest,
  };
}
