import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import type { AxiosInstance } from 'axios';
import listPermissions from '@redhat-cloud-services/rbac-client/ListPermissions';
import listPermissionOptions from '@redhat-cloud-services/rbac-client/ListPermissionOptions';
import { RBAC_API_BASE, apiClient } from './client';

// Bundle permission endpoints
const permissionEndpoints = {
  listPermissions,
  listPermissionOptions,
};

/**
 * Type for the Permissions API client returned by APIFactory.
 */
export type PermissionsApiClient = ReturnType<typeof APIFactory<typeof permissionEndpoints>>;

/**
 * Create a Permissions API client with a custom axios instance.
 * Use this for dependency injection in shared hooks.
 *
 * @param axios - Custom axios instance (e.g., from ServiceContext)
 * @returns Fully typed Permissions API client
 */
export function createPermissionsApi(axios: AxiosInstance): PermissionsApiClient {
  return APIFactory(RBAC_API_BASE, permissionEndpoints, { axios });
}

/**
 * Default Permissions API client - uses the browser apiClient.
 * For shared hooks, prefer createPermissionsApi() with injected axios.
 */
export const permissionsApi = createPermissionsApi(apiClient);

// Disallowed permissions to filter out
const disallowedPermissions: string[] = ['inventory:staleness'];

// Type interfaces
export interface Permission {
  permission: string;
  application?: string;
  resource_type?: string;
  verb?: string;
  description?: string;
  requires?: string[];
}

export interface PermissionsResponse {
  meta: { count: number; limit: number; offset: number };
  links?: Record<string, string>;
  data: Permission[];
}

export interface PermissionOptionsResponse {
  meta: { count: number; limit: number; offset: number };
  links?: Record<string, string>;
  data: string[];
}

export interface ListPermissionsParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
  application?: string;
  resourceType?: string;
  verb?: string;
  permission?: string;
  excludeGlobals?: boolean;
  excludeRoles?: string;
  allowedOnly?: boolean;
}

export interface ListPermissionOptionsParams {
  field: 'application' | 'resource_type' | 'verb';
  limit?: number;
  offset?: number;
  application?: string;
  resourceType?: string;
  verb?: string;
  allowedOnly?: boolean;
}

/**
 * List permissions with optional filtering
 */
export async function listPermissionsFiltered(params: ListPermissionsParams = {}): Promise<PermissionsResponse> {
  const { limit, offset, orderBy, application, resourceType, verb, permission, excludeGlobals = true, excludeRoles, allowedOnly } = params;

  const response = await permissionsApi.listPermissions({
    limit,
    offset,
    orderBy: orderBy as 'application' | 'resource_type' | 'verb' | undefined,
    application,
    resourceType,
    verb,
    permission,
    excludeGlobals: excludeGlobals ? 'true' : 'false',
    excludeRoles,
    allowedOnly: allowedOnly ? 'true' : 'false',
  });

  const data = response.data as PermissionsResponse;

  // Filter out disallowed permissions
  return {
    ...data,
    data: data.data.filter(({ permission }) => !disallowedPermissions.some((item) => permission.includes(item))),
  };
}

/**
 * List permission options (applications, resource types, or verbs)
 */
export async function listPermissionOptionsFiltered(params: ListPermissionOptionsParams): Promise<PermissionOptionsResponse> {
  const { field, limit, offset, application, resourceType, verb, allowedOnly } = params;

  const response = await permissionsApi.listPermissionOptions({
    field,
    limit,
    offset,
    application,
    resourceType,
    verb,
    allowedOnly: allowedOnly ? 'true' : 'false',
  });

  return response.data as PermissionOptionsResponse;
}
