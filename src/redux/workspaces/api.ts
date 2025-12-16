import { errorInterceptor, interceptor500, responseDataInterceptor } from '@redhat-cloud-services/frontend-components-utilities/interceptors';
import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import createWorkspace from '@redhat-cloud-services/rbac-client/v2/WorkspacesCreate';
import deleteWorkspace from '@redhat-cloud-services/rbac-client/v2/WorkspacesDelete';
import moveWorkspaces from '@redhat-cloud-services/rbac-client/v2/WorkspacesMove';
import listWorkspaces from '@redhat-cloud-services/rbac-client/v2/WorkspacesList';
import updateWorkspace from '@redhat-cloud-services/rbac-client/v2/WorkspacesPatch';
import getWorkspace from '@redhat-cloud-services/rbac-client/v2/WorkspacesRead';

import roleBindingsListBySubject from '@redhat-cloud-services/rbac-client/v2/RoleBindingsListBySubject';

import axios, { AxiosError } from 'axios';
import { RBAC_API_BASE_2 } from '../../utilities/constants';
import { RoleBindingBySubject } from './reducer';

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

export interface RoleBindingsPaginatedResponse {
  data: RoleBindingBySubject[];
  meta: {
    count: number;
    limit: number;
    offset: number;
  };
}

const workspacesApiEndpoints = {
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  listWorkspaces,
  moveWorkspaces,
  roleBindingsListBySubject,
};

const workspacesApi = APIFactory<typeof workspacesApiEndpoints>(RBAC_API_BASE_2, workspacesApiEndpoints, {
  axios: axiosInstance,
});

export function getWorkspacesApi() {
  return workspacesApi;
}
