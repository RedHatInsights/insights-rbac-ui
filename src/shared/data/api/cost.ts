import { COST_API_BASE, apiClient } from './client';

// Type definitions
export interface ResourceType {
  value: string;
  path?: string;
  count?: number;
}

export interface ResourceTypesResponse {
  meta: { count: number; limit: number; offset: number };
  links?: Record<string, string>;
  data: ResourceType[];
}

export interface ResourceResponse {
  data: unknown[];
  links?: Record<string, string>;
  meta?: { count: number; limit: number; offset: number };
}

export interface GetResourceTypesParams {
  [key: string]: unknown;
}

export interface GetResourceParams {
  path: string;
  [key: string]: unknown;
}

/**
 * Get resource types (for cost management permissions)
 * Uses direct axios calls since there's no typed client library for cost API.
 */
export async function getResourceTypes(): Promise<ResourceTypesResponse> {
  try {
    const response = await apiClient.get<ResourceTypesResponse>(`${COST_API_BASE}/resource-types/`);
    return response.data;
  } catch {
    // This API can be unavailable in some environments
    return {
      data: [],
      links: {},
      meta: { count: 0, limit: 10, offset: 0 },
    };
  }
}

/**
 * Get a specific resource
 */
export async function getResource(params: GetResourceParams): Promise<ResourceResponse> {
  const response = await apiClient.get<ResourceResponse>(`${params.path}?limit=20000`);
  return response.data;
}
