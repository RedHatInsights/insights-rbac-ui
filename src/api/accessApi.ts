import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import getPrincipalAccess from '@redhat-cloud-services/rbac-client/GetPrincipalAccess';
import listPermissionOptions from '@redhat-cloud-services/rbac-client/ListPermissionOptions';
import listPermissions from '@redhat-cloud-services/rbac-client/ListPermissions';
import { axiosInstance } from './axiosConfig';
import { RBAC_API_BASE } from '../utilities/constants';

const accessApiEndpoints = {
  getPrincipalAccess,
  listPermissions,
  listPermissionOptions,
};

const accessApi = APIFactory<typeof accessApiEndpoints>(RBAC_API_BASE, accessApiEndpoints, { axios: axiosInstance });

export function getAccessApi() {
  return accessApi;
}
