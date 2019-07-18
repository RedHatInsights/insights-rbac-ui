import axios from 'axios';
import { GroupApi, PrincipalApi, AccessApi, RoleApi, PolicyApi } from '@redhat-cloud-services/rbac-client';
import { RBAC_API_BASE } from '../../utilities/constants';

const instance = axios.create();
instance.interceptors.response.use(response => response.data || response);

const rbacApi = new AccessApi(undefined, RBAC_API_BASE, instance);
const principalApi = new PrincipalApi(undefined, RBAC_API_BASE, instance);
const groupApi = new GroupApi(undefined, RBAC_API_BASE, instance);
const roleApi = new RoleApi(undefined, RBAC_API_BASE, instance);
const policyApi = new PolicyApi(undefined, RBAC_API_BASE, instance);

export function getRbacApi() {
  return rbacApi;
}

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
