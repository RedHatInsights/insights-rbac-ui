/**
 * CLI Queries Re-export Module
 *
 * This module handles the ESM/CJS interop boilerplate in one place,
 * providing clean exports for all CLI components to use.
 *
 * Why this exists:
 * The CLI runs in Node.js with ESM, but the data/queries modules are built
 * for browser bundlers. The dual-package hazard causes exports to sometimes
 * be nested under a 'default' key. This module normalizes that.
 */

import * as rolesQueries from '../data/queries/roles.js';
import * as groupsQueries from '../data/queries/groups.js';
import * as workspacesQueries from '../data/queries/workspaces.js';
import * as usersQueries from '../data/queries/users.js';
import * as rolesApi from '../data/api/roles.js';
import * as groupsApi from '../data/api/groups.js';

/**
 * Generic ESM/CJS interop helper.
 * Unwraps module.default if present, otherwise returns the module as-is.
 */
function unwrapModule<T>(mod: T | { default: T }): T {
  return (mod as { default?: T }).default ?? (mod as T);
}

// Normalize all modules
const rolesModule = unwrapModule(rolesQueries);
const groupsModule = unwrapModule(groupsQueries);
const workspacesModule = unwrapModule(workspacesQueries);
const usersModule = unwrapModule(usersQueries);
const rolesApiModule = unwrapModule(rolesApi);
const groupsApiModule = unwrapModule(groupsApi);

// ============================================================================
// Roles Exports
// ============================================================================

export const {
  useRolesQuery,
  useRoleQuery,
  useRoleForPrincipalQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  usePatchRoleMutation,
  rolesKeys,
} = rolesModule;

// Re-export types
export type {
  Role,
  RolesListResponse,
  QueryOptions as RolesQueryOptions,
  MutationOptions as RolesMutationOptions,
  ListRolesParams,
  RoleIn,
  RolePut,
  RolePatch,
  RolePaginationDynamic,
  RoleWithAccess,
  Access,
  AdditionalGroup,
  RoleOutDynamic,
  ResourceDefinition,
} from '../data/queries/roles.js';

// ============================================================================
// Groups Exports
// ============================================================================

export const {
  useGroupsQuery,
  useGroupQuery,
  useAdminGroupQuery,
  useSystemGroupQuery,
  useGroupMembersQuery,
  useGroupRolesQuery,
  useAvailableRolesForGroupQuery,
  useAvailableRolesListQuery,
  useGroupServiceAccountsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useAddMembersToGroupMutation,
  useRemoveMembersFromGroupMutation,
  useAddRolesToGroupMutation,
  useRemoveRolesFromGroupMutation,
  useAddServiceAccountsToGroupMutationV1,
  useAddServiceAccountsToGroupMutation,
  useRemoveServiceAccountsFromGroupMutationV1,
  useRemoveServiceAccountsFromGroupMutation,
  groupsKeys,
} = groupsModule;

// Re-export types
export type {
  Group,
  GroupsListResponse,
  Member,
  MembersQueryResult,
  UseGroupMembersQueryParams,
  GroupRole,
  GroupRolesQueryResult,
  ServiceAccount,
  RawServiceAccountFromApi,
  UseGroupServiceAccountsQueryParams,
  ServiceAccountsListResponse,
  UseGroupsQueryParams,
  UseGroupRolesQueryParams,
  UseAvailableRolesListQueryParams,
  QueryOptions as GroupsQueryOptions,
  MutationOptions as GroupsMutationOptions,
  PaginatedResponse,
  GroupOut,
  ListGroupsParams,
  GroupWithPrincipals,
  GroupWithPrincipalsAndRoles,
} from '../data/queries/groups.js';

// ============================================================================
// Workspaces Exports
// ============================================================================

export const {
  useWorkspacesQuery,
  useWorkspaceQuery,
  useRoleBindingsQuery,
  useWorkspaceGroupBindingsQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
  useMoveWorkspaceMutation,
  isWorkspace,
  workspacesKeys,
  roleBindingsKeys,
} = workspacesModule;

// Re-export types
export type {
  QueryOptions as WorkspacesQueryOptions,
  MutationOptions as WorkspacesMutationOptions,
  WorkspacesListParams,
  WorkspacesPatchParams,
  RoleBindingsListBySubjectParams,
  WorkspacesWorkspace,
  WorkspacesWorkspaceListResponse,
  RoleBindingsRoleBindingBySubject,
  RoleBindingsRoleBindingBySubjectListResponse,
  RoleBindingsRole,
  RoleBindingsRoleBindingBySubjectSubject,
  RoleBindingsResource,
} from '../data/queries/workspaces.js';

// ============================================================================
// Users Exports
// ============================================================================

export const { useUsersQuery, useChangeUserStatusMutation, useUpdateUserOrgAdminMutation, useInviteUsersMutation, usersKeys } = usersModule;

// Re-export types
export type {
  User,
  UsersQueryResult,
  QueryOptions as UsersQueryOptions,
  UseUsersQueryParams,
  ListPrincipalsParams,
  Principal,
  PrincipalPagination,
} from '../data/queries/users.js';

// ============================================================================
// API Clients (for direct API access without React hooks)
// ============================================================================

export const { createRolesApi } = rolesApiModule;
export const { createGroupsApi } = groupsApiModule;

// Re-export API types
export type { RolesApiClient, RoleIn } from '../data/api/roles.js';
export type { GroupsApiClient } from '../data/api/groups.js';
