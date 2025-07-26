import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import addPrincipalToGroup from '@redhat-cloud-services/rbac-client/AddPrincipalToGroup';
import addRoleToGroup from '@redhat-cloud-services/rbac-client/AddRoleToGroup';
import createGroup from '@redhat-cloud-services/rbac-client/CreateGroup';
import deleteGroup from '@redhat-cloud-services/rbac-client/DeleteGroup';
import deletePrincipalFromGroup from '@redhat-cloud-services/rbac-client/DeletePrincipalFromGroup';
import deleteRoleFromGroup from '@redhat-cloud-services/rbac-client/DeleteRoleFromGroup';
import getGroup from '@redhat-cloud-services/rbac-client/GetGroup';
import getPrincipalsFromGroup from '@redhat-cloud-services/rbac-client/GetPrincipalsFromGroup';
import listGroups from '@redhat-cloud-services/rbac-client/ListGroups';
import listRoles from '@redhat-cloud-services/rbac-client/ListRoles';
import listRolesForGroup from '@redhat-cloud-services/rbac-client/ListRolesForGroup';
import updateGroup from '@redhat-cloud-services/rbac-client/UpdateGroup';
import {
  AddRoleToGroup200Response,
  AllPrincipalsPagination,
  GroupOut,
  GroupPagination,
  GroupRolesPagination,
  GroupWithPrincipalsAndRoles,
  RolePagination,
} from '@redhat-cloud-services/rbac-client/types';
import { axiosInstance } from './axiosConfig';
import { RBAC_API_BASE } from '../utilities/constants';

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
  listGroups: GroupPagination;
  getGroup: GroupWithPrincipalsAndRoles;
  updateGroup: GroupOut;
  createGroup: GroupOut;
  addPrincipalToGroup: GroupWithPrincipalsAndRoles;
  addRoleToGroup: AddRoleToGroup200Response;
  deleteGroup: void;
  deletePrincipalFromGroup: void;
  listRoles: RolePagination;
  getPrincipalsFromGroup: AllPrincipalsPagination;
  deleteRoleFromGroup: void;
  listRolesForGroup: GroupRolesPagination;
};

const groupApi = APIFactory<typeof groupApiEndpoints, groupApiEndpointsReturnTypes>(RBAC_API_BASE, groupApiEndpoints, { axios: axiosInstance });

export function getGroupApi() {
  return groupApi;
}
