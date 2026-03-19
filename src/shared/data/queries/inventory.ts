import { useQuery } from '@tanstack/react-query';
import {
  type GetInventoryGroupsParams,
  type InventoryGroupDetailsResponse,
  type InventoryGroupsResponse,
  createInventoryGroupsApi,
  createInventoryResourceTypesApi,
  getInventoryGroups,
  getInventoryGroupsDetails,
} from '../api/inventory';
import { useAppServices } from '../../contexts/ServiceContext';

// ============================================================================
// Query Keys Factory
// ============================================================================

// Stable empty object to avoid infinite re-renders when no params are passed
const EMPTY_INVENTORY_PARAMS: GetInventoryGroupsParams = {};

export const inventoryKeys = {
  all: ['inventory'] as const,
  groups: () => [...inventoryKeys.all, 'groups'] as const,
  groupsList: (params: GetInventoryGroupsParams) => [...inventoryKeys.groups(), 'list', params] as const,
  groupsDetails: (ids: string[]) => [...inventoryKeys.groups(), 'details', ids] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch inventory groups list.
 * Uses useAppServices().axios for DI — works in browser, CLI, and Storybook.
 */
export function useInventoryGroupsQuery(params?: GetInventoryGroupsParams, options?: { enabled?: boolean }) {
  const { axios } = useAppServices();
  const resourceTypesApi = createInventoryResourceTypesApi(axios);
  const stableParams = params ?? EMPTY_INVENTORY_PARAMS;

  return useQuery<InventoryGroupsResponse>({
    queryKey: inventoryKeys.groupsList(stableParams),
    queryFn: () => getInventoryGroups(resourceTypesApi, stableParams),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch inventory groups by IDs.
 * Uses useAppServices().axios for DI — works in browser, CLI, and Storybook.
 */
export function useInventoryGroupsDetailsQuery(groupIds: string[], options?: { enabled?: boolean }) {
  const { axios } = useAppServices();
  const groupsApi = createInventoryGroupsApi(axios);

  return useQuery<InventoryGroupDetailsResponse>({
    queryKey: inventoryKeys.groupsDetails(groupIds),
    queryFn: () => getInventoryGroupsDetails(groupsApi, groupIds),
    enabled: (options?.enabled ?? true) && groupIds.length > 0,
  });
}

// Re-export types and helpers
export type { GetInventoryGroupsParams, InventoryGroup, InventoryGroupsResponse, InventoryGroupDetailsResponse } from '../api/inventory';
export { processResourceDefinitions } from '../api/inventory';
