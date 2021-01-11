/* eslint-disable no-unused-vars */
import axiosInstance from '@redhat-cloud-services/frontend-components-utilities/files/interceptors';
import { GroupApi, PrincipalApi, RoleApi, PolicyApi, AccessApi, PermissionApi } from '@redhat-cloud-services/rbac-client';
import { BaseAPI } from '@redhat-cloud-services/rbac-client/dist/base';

import { RBAC_API_BASE, COST_API_BASE } from '../../utilities/constants';

const principalApi = new PrincipalApi(undefined, RBAC_API_BASE, axiosInstance);
const groupApi = new GroupApi(undefined, RBAC_API_BASE, axiosInstance);
const roleApi = new RoleApi(undefined, RBAC_API_BASE, axiosInstance);
const policyApi = new PolicyApi(undefined, RBAC_API_BASE, axiosInstance);
const accessApi = new AccessApi(undefined, RBAC_API_BASE, axiosInstance);
const permissionApi = new PermissionApi(undefined, RBAC_API_BASE, axiosInstance);
const costApi = new BaseAPI(undefined, COST_API_BASE, axiosInstance);

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

export function getCostApi() {
  return {
    getResourceTypes: () => costApi.axios.get(`${COST_API_BASE}/resource-types/`),
    getResource: (path) => costApi.axios.get(`${path}?limit=1000`),
  };
}
