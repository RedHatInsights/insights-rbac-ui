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

import * as rolesQueries from '../v1/data/queries/roles.js';
import * as groupsQueries from '../shared/data/queries/groups.js';
import * as workspacesQueries from '../v2/data/queries/workspaces.js';
import * as usersQueries from '../shared/data/queries/users.js';
import * as rolesApi from '../v1/data/api/roles.js';
import * as rolesV2Api from '../v2/data/api/roles.js';
import * as groupsApi from '../shared/data/api/groups.js';
import * as workspacesApi from '../v2/data/api/workspaces.js';

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
const rolesV2ApiModule = unwrapModule(rolesV2Api);
const groupsApiModule = unwrapModule(groupsApi);
const workspacesApiModule = unwrapModule(workspacesApi);

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

// Re-export types (QueryOptions/MutationOptions from shared - not re-exported by roles)
export type { QueryOptions as RolesQueryOptions, MutationOptions as RolesMutationOptions } from '../shared/data/types.js';
export type {
  Role,
  RolesListResponse,
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
} from '../v1/data/queries/roles.js';

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
  useAddServiceAccountsToGroupMutation,
  useRemoveServiceAccountsFromGroupMutation,
  groupsKeys,
} = groupsModule;

// Re-export types (QueryOptions/MutationOptions from shared - not re-exported by groups)
export type { QueryOptions as GroupsQueryOptions, MutationOptions as GroupsMutationOptions } from '../shared/data/types.js';
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
  PaginatedResponse,
  GroupOut,
  ListGroupsParams,
  GroupWithPrincipals,
  GroupWithPrincipalsAndRoles,
} from '../shared/data/queries/groups.js';

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

// Re-export types (QueryOptions/MutationOptions from shared - not re-exported by workspaces)
export type { QueryOptions as WorkspacesQueryOptions, MutationOptions as WorkspacesMutationOptions } from '../shared/data/types.js';
export type {
  WorkspacesListParams,
  WorkspacesPatchParams,
  RoleBindingsListBySubjectParams,
  WorkspacesWorkspace,
  WorkspacesWorkspaceListResponse,
  RoleBindingsRoleBindingBySubject,
  RoleBindingsListBySubject200Response,
  RoleBindingsRoleBinding,
  RoleBindingsRoleBindingBySubjectSubject,
  RoleBindingsResource,
} from '../v2/data/queries/workspaces.js';

// ============================================================================
// Users Exports
// ============================================================================

export const { useUsersQuery, useChangeUserStatusMutation, useUpdateUserOrgAdminMutation, useInviteUsersMutation, usersKeys } = usersModule;

// Re-export types (QueryOptions from shared - not re-exported by users)
export type { QueryOptions as UsersQueryOptions } from '../shared/data/types.js';
export type {
  User,
  UsersQueryResult,
  UseUsersQueryParams,
  ListPrincipalsParams,
  Principal,
  PrincipalPagination,
} from '../shared/data/queries/users.js';

// ============================================================================
// API Clients (for direct API access without React hooks)
// ============================================================================

export const { createRolesApi } = rolesApiModule;
export const { createRolesV2Api } = rolesV2ApiModule;
export const { createGroupsApi } = groupsApiModule;
export const { createWorkspacesApi } = workspacesApiModule;

// Re-export API types (RoleIn already re-exported from roles queries)
export type { RolesApiClient } from '../v1/data/api/roles.js';
export type { RolesV2ApiClient, RolesCreateOrUpdateRoleRequest, Permission as V2Permission } from '../v2/data/api/roles.js';
export type { GroupsApiClient, GroupPrincipalIn } from '../shared/data/api/groups.js';
export type { WorkspacesApiClient } from '../v2/data/api/workspaces.js';
