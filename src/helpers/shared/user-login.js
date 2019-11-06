import axiosInstance from '@redhat-cloud-services/frontend-components-utilities/files/interceptors';
import { GroupApi, PrincipalApi, RoleApi, PolicyApi } from '@redhat-cloud-services/rbac-client';
import { RBAC_API_BASE } from '../../utilities/constants';

const principalApi = new PrincipalApi(undefined, RBAC_API_BASE, axiosInstance);
const groupApi = new GroupApi(undefined, RBAC_API_BASE, axiosInstance);
const roleApi = new RoleApi(undefined, RBAC_API_BASE, axiosInstance);
const policyApi = new PolicyApi(undefined, RBAC_API_BASE, axiosInstance);

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

export function getAxiosInstance() {
  return axiosInstance;
}
