/**
 * V2 Roles API Client
 *
 * Uses the real V2 Roles endpoints from @redhat-cloud-services/rbac-client.
 * Follows the same APIFactory pattern as workspaces.ts.
 */

import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import type { AxiosInstance } from 'axios';
import rolesList from '@redhat-cloud-services/rbac-client/v2/RolesList';
import rolesRead from '@redhat-cloud-services/rbac-client/v2/RolesRead';
import rolesCreate from '@redhat-cloud-services/rbac-client/v2/RolesCreate';
import rolesUpdate from '@redhat-cloud-services/rbac-client/v2/RolesUpdate';
import rolesBatchDelete from '@redhat-cloud-services/rbac-client/v2/RolesBatchDelete';
import { RBAC_API_BASE_2, apiClient } from './client';

// Bundle roles V2 endpoints
const rolesV2Endpoints = {
  rolesList,
  rolesRead,
  rolesCreate,
  rolesUpdate,
  rolesBatchDelete,
};

/**
 * Type for the Roles V2 API client returned by APIFactory.
 */
export type RolesV2ApiClient = ReturnType<typeof APIFactory<typeof rolesV2Endpoints>>;

/**
 * Create a Roles V2 API client with a custom axios instance.
 * Use this for dependency injection in shared hooks.
 *
 * @param axios - Custom axios instance (e.g., from ServiceContext)
 * @returns Fully typed Roles V2 API client
 */
export function createRolesV2Api(axios: AxiosInstance): RolesV2ApiClient {
  return APIFactory(RBAC_API_BASE_2, rolesV2Endpoints, { axios });
}

/**
 * Default Roles V2 API client - uses the browser apiClient.
 * For shared hooks, prefer createRolesV2Api() with injected axios.
 */
export const rolesV2Api = createRolesV2Api(apiClient);

// Re-export types from the client
export type { RolesListParams, RolesListReturnType } from '@redhat-cloud-services/rbac-client/v2/RolesList';
export type { RolesReadParams, RolesReadReturnType } from '@redhat-cloud-services/rbac-client/v2/RolesRead';
export type { RolesCreateParams, RolesCreateReturnType } from '@redhat-cloud-services/rbac-client/v2/RolesCreate';
export type { RolesUpdateParams, RolesUpdateReturnType } from '@redhat-cloud-services/rbac-client/v2/RolesUpdate';
export type { RolesBatchDeleteParams, RolesBatchDeleteReturnType } from '@redhat-cloud-services/rbac-client/v2/RolesBatchDelete';
export type {
  RolesRole,
  RolesPermission,
  RolesList200Response,
  RolesCreateOrUpdateRoleRequest,
  RolesBatchDeleteRolesRequest,
  CursorPaginationMeta,
  CursorPaginationLinks,
} from '@redhat-cloud-services/rbac-client/v2/types';
