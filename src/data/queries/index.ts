// Roles queries
export {
  rolesKeys,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  usePatchRoleMutation,
  useRoleQuery,
  useRolesQuery,
  useUpdateRoleMutation,
} from './roles';

// Groups queries
export { groupsKeys, useAdminGroupQuery, useSystemGroupQuery, useGroupQuery } from './groups';

// Permissions queries
export { permissionsKeys, usePermissionsQuery, usePermissionOptionsQuery, useExpandSplatsQuery } from './permissions';

// Cost Management queries
export { costKeys, getResource, useResourceTypesQuery, useResourceQuery } from './cost';

// Inventory queries
export { inventoryKeys, useInventoryGroupsQuery, useInventoryGroupsDetailsQuery, processResourceDefinitions } from './inventory';

// Workspaces queries (V2)
export {
  workspacesKeys,
  roleBindingsKeys,
  useWorkspacesQuery,
  useWorkspaceQuery,
  useRoleBindingsQuery,
  useWorkspaceGroupBindingsQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
} from './workspaces';

// Re-export types - Roles
export type {
  Access,
  AdditionalGroup,
  ListRolesParams,
  Role,
  RoleIn,
  RoleOutDynamic,
  RolePaginationDynamic,
  RolePatch,
  RolePut,
  RoleWithAccess,
} from './roles';

// Re-export types - Groups
export type { GroupOut } from './groups';

// Re-export types - Permissions
export type { ListPermissionsParams, ListPermissionOptionsParams, Permission, PermissionsResponse, PermissionOptionsResponse } from './permissions';

// Re-export types - Cost
export type { GetResourceParams, ResourceType, ResourceTypesResponse, ResourceResponse } from './cost';

// Re-export types - Inventory
export type { GetInventoryGroupsParams, InventoryGroup, InventoryGroupsResponse, InventoryGroupDetailsResponse } from './inventory';

// Re-export types - Workspaces
export type {
  WorkspacesListParams,
  RoleBindingsListBySubjectParams,
  WorkspacesWorkspace,
  WorkspacesWorkspaceListResponse,
  RoleBindingsRoleBindingBySubject,
  RoleBindingsRoleBindingBySubjectListResponse,
  RoleBindingsRole,
} from './workspaces';
