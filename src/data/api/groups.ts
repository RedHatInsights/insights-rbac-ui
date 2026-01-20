import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import listGroups from '@redhat-cloud-services/rbac-client/ListGroups';
import getGroup from '@redhat-cloud-services/rbac-client/GetGroup';
import createGroup from '@redhat-cloud-services/rbac-client/CreateGroup';
import updateGroup from '@redhat-cloud-services/rbac-client/UpdateGroup';
import deleteGroup from '@redhat-cloud-services/rbac-client/DeleteGroup';
import addPrincipalToGroup from '@redhat-cloud-services/rbac-client/AddPrincipalToGroup';
import deletePrincipalFromGroup from '@redhat-cloud-services/rbac-client/DeletePrincipalFromGroup';
import getPrincipalsFromGroup from '@redhat-cloud-services/rbac-client/GetPrincipalsFromGroup';
import listRolesForGroup from '@redhat-cloud-services/rbac-client/ListRolesForGroup';
import addRoleToGroup from '@redhat-cloud-services/rbac-client/AddRoleToGroup';
import deleteRoleFromGroup from '@redhat-cloud-services/rbac-client/DeleteRoleFromGroup';
import { RBAC_API_BASE, apiClient } from './client';

// Bundle all group endpoints
const groupEndpoints = {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addPrincipalToGroup,
  deletePrincipalFromGroup,
  getPrincipalsFromGroup,
  listRolesForGroup,
  addRoleToGroup,
  deleteRoleFromGroup,
};

/**
 * Groups API client - fully typed via rbac-client library.
 * Includes CRUD operations and member management.
 */
export const groupsApi = APIFactory(RBAC_API_BASE, groupEndpoints, { axios: apiClient });

// Re-export types from rbac-client
export type { ListGroupsParams, ListGroupsOrderByEnum } from '@redhat-cloud-services/rbac-client/ListGroups';
export type { CreateGroupParams } from '@redhat-cloud-services/rbac-client/CreateGroup';
export type { UpdateGroupParams } from '@redhat-cloud-services/rbac-client/UpdateGroup';
export type { DeleteGroupParams } from '@redhat-cloud-services/rbac-client/DeleteGroup';
export type { AddPrincipalToGroupParams } from '@redhat-cloud-services/rbac-client/AddPrincipalToGroup';
export type { DeletePrincipalFromGroupParams } from '@redhat-cloud-services/rbac-client/DeletePrincipalFromGroup';
export type {
  GetPrincipalsFromGroupParams,
  GetPrincipalsFromGroupOrderByEnum,
  GetPrincipalsFromGroupPrincipalTypeEnum,
} from '@redhat-cloud-services/rbac-client/GetPrincipalsFromGroup';
export type { ListRolesForGroupParams } from '@redhat-cloud-services/rbac-client/ListRolesForGroup';
export type { AddRoleToGroupParams } from '@redhat-cloud-services/rbac-client/AddRoleToGroup';
export type { DeleteRoleFromGroupParams } from '@redhat-cloud-services/rbac-client/DeleteRoleFromGroup';
export type {
  GroupPagination,
  GroupOut,
  Group as RbacGroup,
  GroupWithPrincipals,
  GroupWithPrincipalsAndRoles,
  PrincipalPagination,
  PrincipalOut,
  GroupRolesPagination,
  RoleOut,
  GroupPrincipalIn,
} from '@redhat-cloud-services/rbac-client/types';

import type { GroupOut as GroupOutType } from '@redhat-cloud-services/rbac-client/types';

/**
 * Group type alias for the GroupOut type from the API.
 * This is the canonical type for group data in the application.
 */
export type Group = GroupOutType;
