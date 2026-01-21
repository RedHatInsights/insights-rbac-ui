import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import type { AxiosInstance } from 'axios';
import getPrincipalAccess from '@redhat-cloud-services/rbac-client/GetPrincipalAccess';
import { RBAC_API_BASE, apiClient } from './client';

// Bundle all access endpoints
const accessEndpoints = {
  getPrincipalAccess,
};

/**
 * Type for the Access API client returned by APIFactory.
 */
export type AccessApiClient = ReturnType<typeof APIFactory<typeof accessEndpoints>>;

/**
 * Create an Access API client with a custom axios instance.
 * Use this for dependency injection in shared hooks.
 *
 * @param axios - Custom axios instance (e.g., from ServiceContext)
 * @returns Fully typed Access API client
 */
export function createAccessApi(axios: AxiosInstance): AccessApiClient {
  return APIFactory(RBAC_API_BASE, accessEndpoints, { axios });
}

/**
 * Default Access API client - uses the browser apiClient.
 * For shared hooks, prefer createAccessApi() with injected axios.
 */
export const accessApi = createAccessApi(apiClient);

// Re-export types for convenience
export type { GetPrincipalAccessParams } from '@redhat-cloud-services/rbac-client/GetPrincipalAccess';
export { GetPrincipalAccessOrderByEnum, GetPrincipalAccessStatusEnum } from '@redhat-cloud-services/rbac-client/GetPrincipalAccess';
export type { Access } from '@redhat-cloud-services/rbac-client/types';
