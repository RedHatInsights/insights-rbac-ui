import { errorInterceptor, interceptor500, responseDataInterceptor } from '@redhat-cloud-services/frontend-components-utilities/interceptors';
import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import { WorkspacesDeleteReturnType, WorkspacesUpdateReturnType } from '@redhat-cloud-services/rbac-client/v2';
import createWorkspace, { WorkspacesCreateReturnType } from '@redhat-cloud-services/rbac-client/v2/WorkspacesCreate';
import deleteWorkspace from '@redhat-cloud-services/rbac-client/v2/WorkspacesDelete';
import moveWorkspaces, { WorkspacesMoveReturnType } from '@redhat-cloud-services/rbac-client/v2/WorkspacesMove';

import listWorkspaces, { WorkspacesListReturnType } from '@redhat-cloud-services/rbac-client/v2/WorkspacesList';
import updateWorkspace from '@redhat-cloud-services/rbac-client/v2/WorkspacesPatch';

import getWorkspace, { WorkspacesReadReturnType } from '@redhat-cloud-services/rbac-client/v2/WorkspacesRead';

import roleBindingsListBySubject, { RoleBindingsListBySubjectReturnType } from '@redhat-cloud-services/rbac-client/v2/RoleBindingsListBySubject';

import axios, { AxiosError } from 'axios';
import { RBAC_API_BASE_2 } from '../../utilities/constants';

// TODO: remove once workspaces endpoints are implemented
const interceptor404 = (error: AxiosError) => {
  if (error.response && error.response.status === 404) {
    return Promise.resolve({});
  }
};

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(null, interceptor404);

axiosInstance.interceptors.response.use(responseDataInterceptor);
axiosInstance.interceptors.response.use(null, interceptor500);
axiosInstance.interceptors.response.use(null, errorInterceptor);

const customCreateWorkspace: typeof createWorkspace = async (...args) => {
  const createWs = await createWorkspace(...args);
  return {
    ...createWs,
    options: {
      ...createWs.options,
      transformResponse: () => {
        return {
          // TODO: return normal data
        };
      },
    },
  };
};

const workspacesApiEndpoints = {
  getWorkspace,
  createWorkspace: customCreateWorkspace,
  updateWorkspace,
  deleteWorkspace,
  listWorkspaces,
  moveWorkspaces,
  roleBindingsListBySubject,
};

type workspacesApiEndpointsReturnType = {
  getWorkspace: WorkspacesReadReturnType;
  createWorkspace: WorkspacesCreateReturnType;
  updateWorkspace: WorkspacesUpdateReturnType;
  deleteWorkspace: WorkspacesDeleteReturnType;
  listWorkspaces: WorkspacesListReturnType;
  moveWorkspaces: WorkspacesMoveReturnType;
  roleBindingsListBySubject: RoleBindingsListBySubjectReturnType;
};

const workspacesApi = APIFactory<typeof workspacesApiEndpoints, workspacesApiEndpointsReturnType>(RBAC_API_BASE_2, workspacesApiEndpoints, {
  axios: axiosInstance,
});

export function getWorkspacesApi() {
  return workspacesApi;
}
