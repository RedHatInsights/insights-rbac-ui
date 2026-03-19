import { useQuery } from '@tanstack/react-query';
import { type GetResourceParams, type ResourceResponse, type ResourceTypesResponse, getResource, getResourceTypes } from '../api/cost';
import { useAppServices } from '../../contexts/ServiceContext';

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
 * Fetch resource types for cost management permissions.
 * Uses useAppServices().axios for DI — works in browser, CLI, and Storybook.
 */
export function useResourceTypesQuery(options?: { enabled?: boolean }) {
  const { axios } = useAppServices();

  return useQuery<ResourceTypesResponse>({
    queryKey: costKeys.resourceTypesList(),
    queryFn: () => getResourceTypes(axios),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch a specific resource.
 * Uses useAppServices().axios for DI — works in browser, CLI, and Storybook.
 */
export function useResourceQuery(params: GetResourceParams, options?: { enabled?: boolean }) {
  const { axios } = useAppServices();

  return useQuery<ResourceResponse>({
    queryKey: costKeys.resourceDetail(params),
    queryFn: () => getResource(axios, params),
    enabled: options?.enabled ?? true,
  });
}

// Re-export API functions for use with useQueries
export { getResource, getResourceTypes } from '../api/cost';

// Re-export types
export type { GetResourceParams, ResourceTypesResponse, ResourceResponse, ResourceType } from '../api/cost';
