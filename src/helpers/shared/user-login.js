/* eslint-disable no-unused-vars */
import React from 'react';
import axios from 'axios';
import {
  authInterceptor,
  responseDataInterceptor,
  interceptor401,
  interceptor500,
  errorInterceptor,
} from '@redhat-cloud-services/frontend-components-utilities/interceptors';

import listPrincipals from '@redhat-cloud-services/rbac-client/dist/ListPrincipals';

import listGroups from '@redhat-cloud-services/rbac-client/dist/ListGroups';
import listRoles from '@redhat-cloud-services/rbac-client/dist/ListRoles';
import getGroup from '@redhat-cloud-services/rbac-client/dist/GetGroup';
import updateGroup from '@redhat-cloud-services/rbac-client/dist/UpdateGroup';
import createGroup from '@redhat-cloud-services/rbac-client/dist/CreateGroup';
import addPrincipalToGroup from '@redhat-cloud-services/rbac-client/dist/AddPrincipalToGroup';
import addRoleToGroup from '@redhat-cloud-services/rbac-client/dist/AddRoleToGroup';
import deleteGroup from '@redhat-cloud-services/rbac-client/dist/DeleteGroup';
import deletePrincipalFromGroup from '@redhat-cloud-services/rbac-client/dist/DeletePrincipalFromGroup';
import getPrincipalsFromGroup from '@redhat-cloud-services/rbac-client/dist/GetPrincipalsFromGroup';
import deleteRoleFromGroup from '@redhat-cloud-services/rbac-client/dist/DeleteRoleFromGroup';
import listRolesForGroup from '@redhat-cloud-services/rbac-client/dist/ListRolesForGroup';

import createRole from '@redhat-cloud-services/rbac-client/dist/CreateRole';
import getRole from '@redhat-cloud-services/rbac-client/dist/GetRole';
import deleteRole from '@redhat-cloud-services/rbac-client/dist/DeleteRole';
import getRoleAccess from '@redhat-cloud-services/rbac-client/dist/GetRoleAccess';
import updateRole from '@redhat-cloud-services/rbac-client/dist/UpdateRole';
import patchRole from '@redhat-cloud-services/rbac-client/dist/PatchRole';

import listPolicies from '@redhat-cloud-services/rbac-client/dist/ListPolicies';
import getPolicy from '@redhat-cloud-services/rbac-client/dist/GetPolicy';
import createPolicies from '@redhat-cloud-services/rbac-client/dist/CreatePolicies';
import updatePolicy from '@redhat-cloud-services/rbac-client/dist/UpdatePolicy';
import deletePolicy from '@redhat-cloud-services/rbac-client/dist/DeletePolicy';

import getPrincipalAccess from '@redhat-cloud-services/rbac-client/dist/GetPrincipalAccess';
import listPermissions from '@redhat-cloud-services/rbac-client/dist/ListPermissions';
import listPermissionOptions from '@redhat-cloud-services/rbac-client/dist/ListPermissionOptions';

import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import { ResourceTypesApi, GroupsApi } from '@redhat-cloud-services/host-inventory-client';
import { BaseAPI } from '@redhat-cloud-services/rbac-client/dist/base';

import { RBAC_API_BASE, COST_API_BASE, INVENTORY_API_BASE } from '../../utilities/constants';
import registry from '../../utilities/store';
import { API_ERROR } from '../../redux/action-types';

const interceptor403 = (error) => {
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

const principalApi = new APIFactory(
  RBAC_API_BASE,
  {
    listPrincipals,
  },
  { axios: axiosInstance }
);

const groupApi = new APIFactory(
  RBAC_API_BASE,
  {
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
  },
  { axios: axiosInstance }
);
const roleApi = new APIFactory(
  RBAC_API_BASE,
  {
    createRole,
    listRoles,
    getRole,
    deleteRole,
    getRoleAccess,
    updateRole,
    patchRole,
  },
  { axios: axiosInstance }
);
const policyApi = new APIFactory(
  RBAC_API_BASE,
  {
    listPolicies,
    getPolicy,
    createPolicies,
    updatePolicy,
    deletePolicy,
  },
  { axios: axiosInstance }
);
const accessApi = new APIFactory(
  RBAC_API_BASE,
  {
    getPrincipalAccess,
    listPermissions,
    listPermissionOptions,
  },
  { axios: axiosInstance }
);
const permissionApi = new APIFactory(
  RBAC_API_BASE,
  {
    listPermissions,
    listPermissionOptions,
  },
  { axios: axiosInstance }
);
const costApi = new BaseAPI(undefined, COST_API_BASE, axiosInstance);
const inventoryResourceTypesApi = new ResourceTypesApi(undefined, INVENTORY_API_BASE, axiosInstance);
const inventoryGroupsApi = new GroupsApi(undefined, INVENTORY_API_BASE, axiosInstance);

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

export function getPermissionApi() {
  return permissionApi;
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

export function getCostApi() {
  return {
    getResourceTypes: () => costApi.axios.get(`${COST_API_BASE}/resource-types/`),
    getResource: (path) => costApi.axios.get(`${path}?limit=20000`),
  };
}

export const getServiceAccountsApi = () => ({
  getServiceAccounts: (page, perPage, token, sso) => {
    const first = (page - 1) * perPage;
    return axios.get(`${sso}/realms/redhat-external/apis/service_accounts/v1?first=${first}&max=${Math.min(perPage + 1, 100)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
});
