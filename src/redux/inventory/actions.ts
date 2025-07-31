import { FETCH_INVENTORY_GROUPS, FETCH_INVENTORY_GROUPS_DETAILS } from './action-types';
import { getInventoryGroups, getInventoryGroupsDetails } from './helper';

// Interface for permissions parameter
interface Permission {
  permission: string;
  [key: string]: unknown;
}

// Interface for config parameter in fetchInventoryGroups
interface InventoryGroupsConfig {
  name?: string;
  perPage?: number;
  page?: number;
  options?: Record<string, unknown>;
}

// Using global ReduxAction interface from store.d.ts
export const fetchInventoryGroups = (permissions: Permission[], config: InventoryGroupsConfig): ReduxAction<Promise<unknown>> => ({
  type: FETCH_INVENTORY_GROUPS,
  meta: { permissions, config },
  payload: getInventoryGroups(config),
});

export const fetchInventoryGroupsDetails = (groupsIds: string[]): ReduxAction<Promise<unknown>> => {
  return {
    type: FETCH_INVENTORY_GROUPS_DETAILS,
    meta: { groupsIds },
    payload: getInventoryGroupsDetails(groupsIds.filter((item) => item?.length > 0)),
  };
};
