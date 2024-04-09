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
import { GroupApi, PrincipalApi, RoleApi, PolicyApi, AccessApi, PermissionApi } from '@redhat-cloud-services/rbac-client';
import { HostsApi } from '@redhat-cloud-services/host-inventory-client';
import { BaseAPI } from '@redhat-cloud-services/rbac-client/base';

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

const principalApi = new PrincipalApi(undefined, RBAC_API_BASE, axiosInstance);
const groupApi = new GroupApi(undefined, RBAC_API_BASE, axiosInstance);
const roleApi = new RoleApi(undefined, RBAC_API_BASE, axiosInstance);
const policyApi = new PolicyApi(undefined, RBAC_API_BASE, axiosInstance);
const accessApi = new AccessApi(undefined, RBAC_API_BASE, axiosInstance);
const permissionApi = new PermissionApi(undefined, RBAC_API_BASE, axiosInstance);
const costApi = new BaseAPI(undefined, COST_API_BASE, axiosInstance);
const inventoryApi = new HostsApi(undefined, INVENTORY_API_BASE, axiosInstance);

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
    getResource: (path) => costApi.axios.get(`${path}?limit=20000`),
  };
}

export const getInventoryGroupsApi = () => ({
  getInventoryGroups: (config) =>
    inventoryApi.axios.get(
      `${INVENTORY_API_BASE}/resource-types/inventory-groups?per_page=${config?.limit ?? 50}&page=${config?.page ?? 1}${
        config?.name ? `&name=${config?.name}` : ''
      }`
    ),
});

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
