// API client setup
export { apiClient } from './client';

// Roles API
export { rolesApi } from './roles';
export type {
  Access,
  ListRolesAddFieldsEnum,
  ListRolesNameMatchEnum,
  ListRolesOrderByEnum,
  ListRolesParams,
  ListRolesScopeEnum,
  Role,
  RoleIn,
  RolePaginationDynamic,
  RolePut,
  RoleWithAccess,
} from './roles';

// Groups API
export { groupsApi } from './groups';
export type { GroupOut, GroupPagination, ListGroupsParams } from './groups';

// Permissions API
export { permissionsApi, listPermissionsFiltered, listPermissionOptionsFiltered } from './permissions';
export type { ListPermissionsParams, ListPermissionOptionsParams, Permission, PermissionsResponse, PermissionOptionsResponse } from './permissions';

// Cost Management API
export { getResourceTypes, getResource } from './cost';
export type { GetResourceParams, ResourceType, ResourceTypesResponse, ResourceResponse } from './cost';

// Inventory API
export {
  inventoryResourceTypesApi,
  inventoryGroupsApi,
  getInventoryGroups,
  getInventoryGroupsDetails,
  processResourceDefinitions,
} from './inventory';
export type { GetInventoryGroupsParams, InventoryGroup, InventoryGroupsResponse, InventoryGroupDetailsResponse } from './inventory';

// Workspaces API (V2)
export { workspacesApi } from './workspaces';
export type {
  WorkspacesListParams,
  WorkspacesReadParams,
  WorkspacesCreateParams,
  WorkspacesPatchParams,
  WorkspacesDeleteParams,
  WorkspacesMoveParams,
  RoleBindingsListBySubjectParams,
  WorkspacesWorkspace,
  WorkspacesWorkspaceListResponse,
  RoleBindingsRoleBindingBySubject,
  RoleBindingsListBySubject200Response,
  RoleBindingsRole,
  RoleBindingsRoleBindingBySubjectSubject,
  RoleBindingsResource,
} from './workspaces';
