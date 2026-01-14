// Main entry point for the data layer

// API setup
export { apiClient } from './api';

// QueryClient
export { queryClient } from './queries';

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
} from './queries';
