// Main entry point for the data layer

// API setup
export { apiClient } from './api';

// Roles queries and mutations
export {
  rolesKeys,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  usePatchRoleMutation,
  useRoleQuery,
  useRolesQuery,
  useUpdateRoleMutation,
} from './queries';

// Groups queries
export { groupsKeys, useAdminGroupQuery, useGroupQuery } from './queries';

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
} from './queries';

// Types
export type {
  Access,
  AdditionalGroup,
  GroupOut,
  ListRolesParams,
  Role,
  RoleIn,
  RoleOutDynamic,
  RolePaginationDynamic,
  RolePatch,
  RolePut,
  RoleWithAccess,
  // Workspaces types
  WorkspacesListParams,
  RoleBindingsListBySubjectParams,
  WorkspacesWorkspace,
  WorkspacesWorkspaceListResponse,
  RoleBindingsRoleBindingBySubject,
  RoleBindingsRoleBindingBySubjectListResponse,
  RoleBindingsRole,
} from './queries';
