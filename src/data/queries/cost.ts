import { useQuery } from '@tanstack/react-query';
import { type GetResourceParams, type ResourceResponse, type ResourceTypesResponse, getResource, getResourceTypes } from '../api/cost';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const costKeys = {
  all: ['cost'] as const,
  resourceTypes: () => [...costKeys.all, 'resourceTypes'] as const,
  resourceTypesList: () => [...costKeys.resourceTypes(), 'list'] as const,
  resource: () => [...costKeys.all, 'resource'] as const,
  resourceDetail: (params: GetResourceParams) => [...costKeys.resource(), params] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch resource types for cost management permissions
 */
export function useResourceTypesQuery(options?: { enabled?: boolean }) {
  return useQuery<ResourceTypesResponse>({
    queryKey: costKeys.resourceTypesList(),
    queryFn: () => getResourceTypes(),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch a specific resource
 */
export function useResourceQuery(params: GetResourceParams, options?: { enabled?: boolean }) {
  return useQuery<ResourceResponse>({
    queryKey: costKeys.resourceDetail(params),
    queryFn: () => getResource(params),
    enabled: options?.enabled ?? true,
  });
}

// Re-export API functions for use with useQueries
export { getResource, getResourceTypes } from '../api/cost';

// Re-export types
export type { GetResourceParams, ResourceTypesResponse, ResourceResponse, ResourceType } from '../api/cost';
