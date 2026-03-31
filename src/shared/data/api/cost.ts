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
 * Get a specific resource by path.
 * Accepts the full path from the resource-types API response
 * (e.g. "/api/cost-management/v1/resource-types/aws-accounts/")
 * or a bare slug for backward compatibility (e.g. "aws-accounts").
 */
export async function getResource(params: GetResourceParams): Promise<ResourceResponse> {
  const fullPath = params.path.includes('/') ? params.path : `${COST_API_BASE}/resource-types/${params.path}/`;
  const separator = fullPath.includes('?') ? '&' : '?';
  const response = await apiClient.get<ResourceResponse>(`${fullPath}${separator}limit=20000`);
  return response.data;
}
