import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import type { AxiosInstance } from 'axios';
import { apiGroupGetGroupsById, apiResourceTypeGetResourceTypeGroupsList } from '@redhat-cloud-services/host-inventory-client';
import flatten from 'lodash/flatten';
import { INVENTORY_API_BASE, apiClient } from './client';

// Bundle inventory endpoints
const inventoryResourceTypesEndpoints = {
  apiResourceTypeGetResourceTypeGroupsList,
};

const inventoryGroupsEndpoints = {
  apiGroupGetGroupsById,
};

/**
 * Type for the Inventory Resource Types API client.
 */
export type InventoryResourceTypesApiClient = ReturnType<typeof APIFactory<typeof inventoryResourceTypesEndpoints>>;

/**
 * Type for the Inventory Groups API client.
 */
export type InventoryGroupsApiClient = ReturnType<typeof APIFactory<typeof inventoryGroupsEndpoints>>;

/**
 * Create an Inventory Resource Types API client with a custom axios instance.
 */
export function createInventoryResourceTypesApi(axios: AxiosInstance): InventoryResourceTypesApiClient {
  return APIFactory(INVENTORY_API_BASE, inventoryResourceTypesEndpoints, { axios });
}

/**
 * Create an Inventory Groups API client with a custom axios instance.
 */
export function createInventoryGroupsApi(axios: AxiosInstance): InventoryGroupsApiClient {
  return APIFactory(INVENTORY_API_BASE, inventoryGroupsEndpoints, { axios });
}

/**
 * Default Inventory Resource Types API client.
 */
export const inventoryResourceTypesApi = createInventoryResourceTypesApi(apiClient);

/**
 * Default Inventory Groups API client.
 */
export const inventoryGroupsApi = createInventoryGroupsApi(apiClient);

// ============================================================================
// Type Definitions - Based on ACTUAL API responses from staging, NOT library types
// The @redhat-cloud-services/host-inventory-client types are known to be incorrect.
// ============================================================================

export interface InventoryGroup {
  id: string;
  name: string;
  host_count?: number;
  created?: string;
  updated?: string;
}

/**
 * Response from /api/inventory/v1/resource-types/inventory-groups
 * Real API returns { meta, links, data } NOT { results, count, page, per_page, total }
 */
export interface InventoryGroupsResponse {
  data: InventoryGroup[];
  meta: {
    count: number;
  };
  links: {
    first: string | null;
    previous: string | null;
    next: string | null;
    last: string | null;
  };
}

/**
 * Response from /api/inventory/v1/groups/:groupIds
 * IMPORTANT: This endpoint returns a DIFFERENT structure than the list endpoint!
 * Real API returns { total, count, page, per_page, results } NOT { meta, links, data }
 */
export interface InventoryGroupDetailsResponse {
  results: InventoryGroup[];
  total: number;
  count: number;
  page: number;
  per_page: number;
}

export interface GetInventoryGroupsParams {
  name?: string;
  perPage?: number;
  page?: number;
}

// Type for resource definitions
interface AttributeFilter {
  value: unknown[];
}

interface ResourceDefinition {
  attributeFilter: AttributeFilter;
}

/**
 * Get inventory groups list
 * NOTE: The host-inventory-client functions expect positional parameters, not an object.
 * Using (apiMethod as any) to bypass broken type definitions.
 * APIFactory returns AxiosResponse - we must access .data to get the payload.
 */
export async function getInventoryGroups(params: GetInventoryGroupsParams = {}): Promise<InventoryGroupsResponse> {
  const { name, perPage, page } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (inventoryResourceTypesApi.apiResourceTypeGetResourceTypeGroupsList as any)(name, perPage, page);

  // APIFactory returns AxiosResponse { data, status, headers, ... }
  // The actual API response is in response.data
  // Real API structure: { meta: { count }, links: {...}, data: [...] }
  return response.data as InventoryGroupsResponse;
}

/**
 * Get inventory groups by IDs
 * NOTE: The host-inventory-client functions expect positional parameters, not an object.
 * Using (apiMethod as any) to bypass broken type definitions.
 * APIFactory returns AxiosResponse - we must access .data to get the payload.
 */
export async function getInventoryGroupsDetails(groupIds: string[]): Promise<InventoryGroupDetailsResponse> {
  const validIds = groupIds.filter((id) => id?.length > 0);

  if (validIds.length === 0) {
    return {
      results: [],
      total: 0,
      count: 0,
      page: 1,
      per_page: 10,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (inventoryGroupsApi.apiGroupGetGroupsById as any)(validIds);

  // APIFactory returns AxiosResponse { data, status, headers, ... }
  // The actual API response is in response.data
  // Real API structure: { total, count, page, per_page, results: [...] }
  return response.data as InventoryGroupDetailsResponse;
}

/**
 * Process resource definitions to extract group IDs
 */
export function processResourceDefinitions(resourceDefinitions?: ResourceDefinition[]): unknown[] {
  return resourceDefinitions ? flatten(resourceDefinitions.map((definition) => definition.attributeFilter.value)) : [];
}
