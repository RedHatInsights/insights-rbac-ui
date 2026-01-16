import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import listPrincipals from '@redhat-cloud-services/rbac-client/ListPrincipals';
import { RBAC_API_BASE, apiClient } from './client';

// Bundle user/principal endpoints
const userEndpoints = {
  listPrincipals,
};

/**
 * Users/Principals API client - fully typed via rbac-client library.
 */
export const usersApi = APIFactory(RBAC_API_BASE, userEndpoints, { axios: apiClient });

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
