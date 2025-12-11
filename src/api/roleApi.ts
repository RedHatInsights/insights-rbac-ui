import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import createRole from '@redhat-cloud-services/rbac-client/CreateRole';
import deleteRole from '@redhat-cloud-services/rbac-client/DeleteRole';
import getRole from '@redhat-cloud-services/rbac-client/GetRole';
import getRoleAccess from '@redhat-cloud-services/rbac-client/GetRoleAccess';
import listRoles from '@redhat-cloud-services/rbac-client/ListRoles';
import patchRole from '@redhat-cloud-services/rbac-client/PatchRole';
import updateRole from '@redhat-cloud-services/rbac-client/UpdateRole';
import { axiosInstance } from './axiosConfig';
import { RBAC_API_BASE } from '../utilities/constants';

const roleApiEndpoints = {
  listRoles,
  getRole,
  updateRole,
  createRole,
  deleteRole,
  getRoleAccess,
  patchRole,
};

const roleApi = APIFactory<typeof roleApiEndpoints>(RBAC_API_BASE, roleApiEndpoints, { axios: axiosInstance });

export function getRoleApi() {
  return roleApi;
}
