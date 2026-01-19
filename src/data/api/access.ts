import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import getPrincipalAccess from '@redhat-cloud-services/rbac-client/GetPrincipalAccess';
import { RBAC_API_BASE, apiClient } from './client';

// Bundle all access endpoints
const accessEndpoints = {
  getPrincipalAccess,
};

/**
 * Access API client - fully typed via rbac-client library.
 * Uses APIFactory to bind endpoints to our axios instance.
 */
export const accessApi = APIFactory(RBAC_API_BASE, accessEndpoints, { axios: apiClient });

// Re-export types for convenience
export type { GetPrincipalAccessParams } from '@redhat-cloud-services/rbac-client/GetPrincipalAccess';
export { GetPrincipalAccessOrderByEnum, GetPrincipalAccessStatusEnum } from '@redhat-cloud-services/rbac-client/GetPrincipalAccess';
export type { Access } from '@redhat-cloud-services/rbac-client/types';
