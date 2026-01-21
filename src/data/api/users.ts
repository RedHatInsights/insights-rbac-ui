import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import type { AxiosInstance } from 'axios';
import listPrincipals from '@redhat-cloud-services/rbac-client/ListPrincipals';
import { RBAC_API_BASE, apiClient } from './client';

// Bundle user/principal endpoints
const userEndpoints = {
  listPrincipals,
};

/**
 * Type for the Users API client returned by APIFactory.
 */
export type UsersApiClient = ReturnType<typeof APIFactory<typeof userEndpoints>>;

/**
 * Create a Users API client with a custom axios instance.
 * Use this for dependency injection in shared hooks.
 *
 * @param axios - Custom axios instance (e.g., from ServiceContext)
 * @returns Fully typed Users API client
 */
export function createUsersApi(axios: AxiosInstance): UsersApiClient {
  return APIFactory(RBAC_API_BASE, userEndpoints, { axios });
}

/**
 * Default Users/Principals API client - uses the browser apiClient.
 * For shared hooks, prefer createUsersApi() with injected axios.
 */
export const usersApi = createUsersApi(apiClient);

// Re-export types from rbac-client
export type { ListPrincipalsParams } from '@redhat-cloud-services/rbac-client/ListPrincipals';
export type { PrincipalPagination, PrincipalOut, PrincipalExternalSourceId, Principal } from '@redhat-cloud-services/rbac-client/types';

/**
 * User type for the application.
 * Extends the Principal type from the API with application-specific properties.
 *
 * Note: The API may return additional fields that aren't strictly typed.
 * We allow unknown properties to be flexible with API responses.
 */
export interface User {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_org_admin?: boolean;
  external_source_id?: number | string;
  // Allow additional properties from API responses
  [key: string]: unknown;
}
