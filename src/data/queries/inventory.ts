import { useQuery } from '@tanstack/react-query';
import {
  type GetInventoryGroupsParams,
  type InventoryGroupDetailsResponse,
  type InventoryGroupsResponse,
  getInventoryGroups,
  getInventoryGroupsDetails,
} from '../api/inventory';

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
 * Fetch inventory groups list
 */
export function useInventoryGroupsQuery(params?: GetInventoryGroupsParams, options?: { enabled?: boolean }) {
  const stableParams = params ?? EMPTY_INVENTORY_PARAMS;
  return useQuery<InventoryGroupsResponse>({
    queryKey: inventoryKeys.groupsList(stableParams),
    queryFn: () => getInventoryGroups(stableParams),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch inventory groups by IDs
 */
export function useInventoryGroupsDetailsQuery(groupIds: string[], options?: { enabled?: boolean }) {
  return useQuery<InventoryGroupDetailsResponse>({
    queryKey: inventoryKeys.groupsDetails(groupIds),
    queryFn: () => getInventoryGroupsDetails(groupIds),
    enabled: (options?.enabled ?? true) && groupIds.length > 0,
  });
}

// Re-export types and helpers
export type { GetInventoryGroupsParams, InventoryGroup, InventoryGroupsResponse, InventoryGroupDetailsResponse } from '../api/inventory';
export { processResourceDefinitions } from '../api/inventory';
