import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import listRoles from '@redhat-cloud-services/rbac-client/ListRoles';
import getRole from '@redhat-cloud-services/rbac-client/GetRole';
import getRoleAccess from '@redhat-cloud-services/rbac-client/GetRoleAccess';
import createRole from '@redhat-cloud-services/rbac-client/CreateRole';
import updateRole from '@redhat-cloud-services/rbac-client/UpdateRole';
import patchRole from '@redhat-cloud-services/rbac-client/PatchRole';
import deleteRole from '@redhat-cloud-services/rbac-client/DeleteRole';
import { RBAC_API_BASE, apiClient } from './client';

// Bundle all role endpoints
const roleEndpoints = {
  listRoles,
  getRole,
  getRoleAccess,
  createRole,
  updateRole,
  patchRole,
  deleteRole,
};

/**
 * Roles API client - fully typed via rbac-client library.
 * Uses APIFactory to bind endpoints to our axios instance.
 */
export const rolesApi = APIFactory(RBAC_API_BASE, roleEndpoints, { axios: apiClient });

// Re-export types for convenience
export type {
  ListRolesParams,
  ListRolesNameMatchEnum,
  ListRolesScopeEnum,
  ListRolesOrderByEnum,
  ListRolesAddFieldsEnum,
} from '@redhat-cloud-services/rbac-client/ListRoles';

export type { GetRoleParams } from '@redhat-cloud-services/rbac-client/GetRole';

export type {
  RolePaginationDynamic,
  RoleWithAccess,
  Role,
  RoleIn,
  RolePut,
  RolePatch,
  Access,
  AccessPagination,
  AdditionalGroup,
  RoleOutDynamic,
  ResourceDefinition,
} from '@redhat-cloud-services/rbac-client/types';

export type { PatchRoleParams } from '@redhat-cloud-services/rbac-client/PatchRole';
