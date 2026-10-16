import type { AxiosInstance } from 'axios';
import { RBAC_API_BASE, apiClient } from './client';

/**
 * Whether the tenant has opted into RBAC V2. Returned by both GET and PATCH on /tenant/opt-in/.
 */
export interface TenantOptInResponse {
  v2_opted_in: boolean;
}

/**
 * Request body for opting in. The API only accepts `true`; there is no opting back out.
 */
export interface TenantOptInRequest {
  v2_opted_in: true;
}

/** A role that blocks opt-in, along with the applications that make it ineligible. */
export interface TenantOptInIneligibleRole {
  uuid: string;
  name: string;
  ineligible_applications: string[];
}

/** A group that blocks opt-in because of the system roles bound to it. */
export interface TenantOptInIneligibleGroup {
  uuid: string;
  name: string;
  ineligible_system_roles: TenantOptInIneligibleRole[];
}

export interface TenantOptInEligibleResponse {
  eligible: true;
}

/**
 * Also the body of a 422 from PATCH /tenant/opt-in/: it names exactly which roles and
 * groups have to be dealt with before the tenant can convert.
 */
export interface TenantOptInIneligibleResponse {
  eligible: false;
  bootstrapped: boolean;
  ineligible_custom_roles: TenantOptInIneligibleRole[];
  ineligible_groups: TenantOptInIneligibleGroup[];
}

/** Discriminated on `eligible`. */
export type TenantOptInEligibility = TenantOptInEligibleResponse | TenantOptInIneligibleResponse;

/** Shape of the RBAC error bodies returned on 403 and 500. */
export interface TenantApiErrorResponse {
  errors: Array<{
    detail?: string;
    source?: string;
    status?: string;
  }>;
}

/**
 * Create a Tenant API client with a custom axios instance.
 *
 * @param axios - Custom axios instance (e.g., from ServiceContext)
 * @returns Tenant API client functions
 */
export function createTenantApi(axios: AxiosInstance) {
  const basePath = `${RBAC_API_BASE}/tenant/opt-in/`;

  return {
    /**
     * Get the current opt-in status for the tenant
     */
    getOptInStatus: async (): Promise<TenantOptInResponse> => {
      const response = await axios.get<TenantOptInResponse>(basePath);
      return response.data;
    },

    /**
     * Opt the tenant into V2 workspace-based access management
     *
     * @returns The updated opt-in status
     * @throws {AxiosError} with status:
     *   - 400: Bad Input (malformed body)
     *   - 401: Unauthorized - never reaches callers; the shared client reloads the page
     *   - 403: Insufficient permissions; body is {@link TenantApiErrorResponse}
     *   - 422: Opt-in is not possible; body is {@link TenantOptInIneligibleResponse}
     *   - 500: Unexpected Error; body is {@link TenantApiErrorResponse}
     */
    optIn: async (): Promise<TenantOptInResponse> => {
      const body: TenantOptInRequest = { v2_opted_in: true };
      const response = await axios.patch<TenantOptInResponse>(basePath, body);
      return response.data;
    },

    /**
     * Check whether the tenant is eligible to opt into V2. A 200 can mean either
     * outcome, so narrow on the `eligible` field rather than on the status code.
     */
    getEligibility: async (): Promise<TenantOptInEligibility> => {
      const response = await axios.get<TenantOptInEligibility>(`${basePath}eligibility/`);
      return response.data;
    },
  };
}

/**
 * Default Tenant API client - uses the browser apiClient.
 * For shared hooks, prefer createTenantApi() with injected axios.
 */
export const tenantApi = createTenantApi(apiClient);
