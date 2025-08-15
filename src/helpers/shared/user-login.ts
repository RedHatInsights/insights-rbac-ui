import {
  authInterceptor,
  errorInterceptor,
  interceptor401,
  interceptor500,
  responseDataInterceptor,
} from '@redhat-cloud-services/frontend-components-utilities/interceptors';
import {
  ApiGroupGetGroupsByIdReturnType,
  ApiResourceTypeGetResourceTypeGroupsListReturnType,
  apiGroupGetGroupsById,
  apiResourceTypeGetResourceTypeGroupsList,
} from '@redhat-cloud-services/host-inventory-client';

import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import addPrincipalToGroup, { AddPrincipalToGroupReturnType } from '@redhat-cloud-services/rbac-client/AddPrincipalToGroup';
import addRoleToGroup, { AddRoleToGroupReturnType } from '@redhat-cloud-services/rbac-client/AddRoleToGroup';
import createGroup, { CreateGroupReturnType } from '@redhat-cloud-services/rbac-client/CreateGroup';
import createPolicies from '@redhat-cloud-services/rbac-client/CreatePolicies';

import createRole, { CreateRoleReturnType } from '@redhat-cloud-services/rbac-client/CreateRole';
import deleteGroup, { DeleteGroupReturnType } from '@redhat-cloud-services/rbac-client/DeleteGroup';
import deletePolicy from '@redhat-cloud-services/rbac-client/DeletePolicy';
import deletePrincipalFromGroup, { DeletePrincipalFromGroupReturnType } from '@redhat-cloud-services/rbac-client/DeletePrincipalFromGroup';
import deleteRole, { DeleteRoleReturnType } from '@redhat-cloud-services/rbac-client/DeleteRole';
import deleteRoleFromGroup, { DeleteRoleFromGroupReturnType } from '@redhat-cloud-services/rbac-client/DeleteRoleFromGroup';
import getGroup, { GetGroupReturnType } from '@redhat-cloud-services/rbac-client/GetGroup';
import getPolicy from '@redhat-cloud-services/rbac-client/GetPolicy';

import getPrincipalAccess, { GetPrincipalAccessReturnType } from '@redhat-cloud-services/rbac-client/GetPrincipalAccess';
import getPrincipalsFromGroup, { GetPrincipalsFromGroupReturnType } from '@redhat-cloud-services/rbac-client/GetPrincipalsFromGroup';
import getRole, { GetRoleReturnType } from '@redhat-cloud-services/rbac-client/GetRole';
import getRoleAccess from '@redhat-cloud-services/rbac-client/GetRoleAccess';
import listGroups, { ListGroupsReturnType } from '@redhat-cloud-services/rbac-client/ListGroups';
import listPermissionOptions, { ListPermissionOptionsReturnType } from '@redhat-cloud-services/rbac-client/ListPermissionOptions';
import listPermissions, { ListPermissionsReturnType } from '@redhat-cloud-services/rbac-client/ListPermissions';

import listPolicies from '@redhat-cloud-services/rbac-client/ListPolicies';

import listPrincipals, { ListPrincipalsReturnType } from '@redhat-cloud-services/rbac-client/ListPrincipals';
import listRoles, { ListRolesReturnType } from '@redhat-cloud-services/rbac-client/ListRoles';
import listRolesForGroup, { ListRolesForGroupReturnType } from '@redhat-cloud-services/rbac-client/ListRolesForGroup';
import patchRole, { PatchRoleReturnType } from '@redhat-cloud-services/rbac-client/PatchRole';
import updateGroup, { UpdateGroupReturnType } from '@redhat-cloud-services/rbac-client/UpdateGroup';
import updatePolicy from '@redhat-cloud-services/rbac-client/UpdatePolicy';
import updateRole, { UpdateRoleReturnType } from '@redhat-cloud-services/rbac-client/UpdateRole';
import axios, { AxiosError } from 'axios';
import { API_ERROR } from '../../redux/action-types';

import { COST_API_BASE, INVENTORY_API_BASE, RBAC_API_BASE } from '../../utilities/constants';
import registry from '../../utilities/store';

const interceptor403 = (error: AxiosError) => {
  const store = registry.getStore();

  if (error.response && error.response.status === 403) {
    store.dispatch({ type: API_ERROR, payload: 403 });
  }

  throw error;
};

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use(authInterceptor);
axiosInstance.interceptors.response.use(responseDataInterceptor);

axiosInstance.interceptors.response.use(null, interceptor401);
axiosInstance.interceptors.response.use(null, interceptor403);
axiosInstance.interceptors.response.use(null, interceptor500);
axiosInstance.interceptors.response.use(null, errorInterceptor);

const principalApiEndpoints = {
  listPrincipals,
};

type principalApiEndpointsReturnTypes = {
  listPrincipals: ListPrincipalsReturnType;
};

const principalApi = APIFactory<typeof principalApiEndpoints, principalApiEndpointsReturnTypes>(RBAC_API_BASE, principalApiEndpoints, {
  axios: axiosInstance,
});

const groupApiEndpoints = {
  listGroups,
  getGroup,
  updateGroup,
  createGroup,
  addPrincipalToGroup,
  addRoleToGroup,
  deleteGroup,
  deletePrincipalFromGroup,
  listRoles,
  getPrincipalsFromGroup,
  deleteRoleFromGroup,
  listRolesForGroup,
};

type groupApiEndpointsReturnTypes = {
  listGroups: ListGroupsReturnType;
  getGroup: GetGroupReturnType;
  updateGroup: UpdateGroupReturnType;
  createGroup: CreateGroupReturnType;
  addPrincipalToGroup: AddPrincipalToGroupReturnType;
  addRoleToGroup: AddRoleToGroupReturnType;
  deleteGroup: DeleteGroupReturnType;
  deletePrincipalFromGroup: DeletePrincipalFromGroupReturnType;
  listRoles: ListRolesReturnType;
  getPrincipalsFromGroup: GetPrincipalsFromGroupReturnType;
  deleteRoleFromGroup: DeleteRoleFromGroupReturnType;
  listRolesForGroup: ListRolesForGroupReturnType;
};

const groupApi = APIFactory<typeof groupApiEndpoints, groupApiEndpointsReturnTypes>(RBAC_API_BASE, groupApiEndpoints, { axios: axiosInstance });

const roleApiEndpoints = {
  listRoles,
  getRole,
  updateRole,
  createRole,
  deleteRole,
  getRoleAccess,
  patchRole,
};

type roleApiEndpointsReturnTypes = {
  createRole: CreateRoleReturnType;
  listRoles: ListRolesReturnType;
  getRole: GetRoleReturnType;
  deleteRole: DeleteRoleReturnType;
  getRoleAccess: GetRoleReturnType;
  updateRole: UpdateRoleReturnType;
  patchRole: PatchRoleReturnType;
};

const roleApi = APIFactory<typeof roleApiEndpoints, roleApiEndpointsReturnTypes>(RBAC_API_BASE, roleApiEndpoints, { axios: axiosInstance });

const policyApiEndpoints = {
  listPolicies,
  getPolicy,
  updatePolicy,
  createPolicies,
  deletePolicy,
};

type policyApiEndpointsReturnTypes = {
  listPolicies: unknown;
  getPolicy: unknown;
  createPolicies: unknown;
  updatePolicy: unknown;
  deletePolicy: unknown;
};
const policyApi = APIFactory<typeof policyApiEndpoints, policyApiEndpointsReturnTypes>(RBAC_API_BASE, policyApiEndpoints, { axios: axiosInstance });

const accessApiEndpoints = {
  getPrincipalAccess,
  listPermissions,
  listPermissionOptions,
};

type accessApiEndpointsReturnTypes = {
  getPrincipalAccess: GetPrincipalAccessReturnType;
  listPermissions: ListPermissionsReturnType;
  listPermissionOptions: ListPermissionOptionsReturnType;
};

const accessApi = APIFactory<typeof accessApiEndpoints, accessApiEndpointsReturnTypes>(RBAC_API_BASE, accessApiEndpoints, { axios: axiosInstance });

const inventoryResourceTypesEndpoints = {
  apiResourceTypeGetResourceTypeGroupsList,
};
type inventoryResourceTypesEndpointsReturnTypes = {
  apiResourceTypeGetResourceTypeGroupsList: ApiResourceTypeGetResourceTypeGroupsListReturnType;
};
const inventoryResourceTypesApi = APIFactory<typeof inventoryResourceTypesEndpoints, inventoryResourceTypesEndpointsReturnTypes>(
  INVENTORY_API_BASE,
  inventoryResourceTypesEndpoints,
  { axios: axiosInstance },
);

const inventoryGroupsEndpoints = {
  apiGroupGetGroupsById,
};

type inventoryGroupsEndpointsReturnTypes = {
  apiGroupGetGroupsById: ApiGroupGetGroupsByIdReturnType;
};

const inventoryGroupsApi = APIFactory<typeof inventoryGroupsEndpoints, inventoryGroupsEndpointsReturnTypes>(
  INVENTORY_API_BASE,
  inventoryGroupsEndpoints,
  { axios: axiosInstance },
);

export function getPrincipalApi() {
  return principalApi;
}

export function getGroupApi() {
  return groupApi;
}

export function getRoleApi() {
  return roleApi;
}

export function getPolicyApi() {
  return policyApi;
}

export function getAccessApi() {
  return accessApi;
}

export function getAxiosInstance() {
  return axiosInstance;
}

export function getInventoryResourceTypesApi() {
  return inventoryResourceTypesApi;
}

export function getInventoryGroupsApi() {
  return inventoryGroupsApi;
}

interface CostApiResponse {
  getResourceTypes: () => Promise<any>;
  getResource: (path: string) => Promise<any>;
}

export function getCostApi(): CostApiResponse {
  return {
    getResourceTypes: () => axiosInstance.get(`${COST_API_BASE}/resource-types/`),
    getResource: (path: string) => axiosInstance.get(`${path}?limit=20000`),
  };
}

interface ServiceAccountsApiResponse {
  getServiceAccounts: (page: number, perPage: number, token: string, sso: string) => Promise<any>;
}

export const getServiceAccountsApi = (): ServiceAccountsApiResponse => ({
  getServiceAccounts: (page: number, perPage: number, token: string, sso: string) => {
    const first = (page - 1) * perPage;
    return axios.get(`${sso}/realms/redhat-external/apis/service_accounts/v1?first=${first}&max=${Math.min(perPage + 1, 100)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
});
