import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import getPrincipalAccess, { GetPrincipalAccessReturnType } from '@redhat-cloud-services/rbac-client/GetPrincipalAccess';
import listPermissionOptions, { ListPermissionOptionsReturnType } from '@redhat-cloud-services/rbac-client/ListPermissionOptions';
import listPermissions, { ListPermissionsReturnType } from '@redhat-cloud-services/rbac-client/ListPermissions';
import { axiosInstance } from './axiosConfig';
import { RBAC_API_BASE } from '../utilities/constants';

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

export function getAccessApi() {
  return accessApi;
}
