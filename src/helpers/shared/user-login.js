import axios from 'axios';
import { GroupApi, PrincipalApi, AccessApi } from '@redhat-cloud-services/rbac-client';
import { RBAC_API_BASE } from '../../utilities/constants';

const instance = axios.create();
instance.interceptors.response.use(response => response.data || response);

let rbacApi = new AccessApi(undefined, RBAC_API_BASE, instance);
let principalApi = new PrincipalApi(undefined, RBAC_API_BASE, instance);
const groupApi = new GroupApi(undefined, RBAC_API_BASE, instance);

export function getRbacApi() {
  return rbacApi;
}

export function getPrincipalApi() {
  return principalApi;
}

export function getGroupApi() {
  return groupApi;
}
