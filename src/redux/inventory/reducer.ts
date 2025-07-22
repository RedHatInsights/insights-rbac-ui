import { FETCH_INVENTORY_GROUPS, FETCH_INVENTORY_GROUPS_DETAILS } from './action-types';

// Type definitions for inventory
interface ResourceType {
  name: string;
  [key: string]: unknown;
}

interface ResourceTypesMap {
  [key: string]: ResourceType;
}

interface PermissionsResourceTypesMap {
  [permission: string]: ResourceTypesMap;
}

interface InventoryGroupDetail {
  id: string;
  [key: string]: unknown;
}

interface InventoryGroupsDetailsMap {
  [groupId: string]: InventoryGroupDetail;
}

export interface InventoryState {
  isLoading: boolean;
  resourceTypes: PermissionsResourceTypesMap;
  inventoryGroupsDetails: InventoryGroupsDetailsMap;
  total: number;
  [key: string]: unknown;
}

interface PayloadWithData {
  data: ResourceType[];
  meta: {
    count: number;
  };
}

interface PayloadWithResults {
  results: InventoryGroupDetail[];
}

// Using global ReduxAction interface from store.d.ts instead of local Action interface

export const inventoryGroupsInitialState: InventoryState = {
  isLoading: false,
  resourceTypes: {},
  inventoryGroupsDetails: {},
  total: 0,
};

const setLoadingState = (state: InventoryState): InventoryState => ({ ...state, isLoading: true });

const setResourceTypes = (state: InventoryState, action?: ReduxAction<PayloadWithData>): InventoryState => {
  if (!action) return state;
  const { payload, meta } = action;
  const data: ResourceTypesMap = payload.data.reduce((acc, curr) => ({ ...acc, [curr.name]: { ...curr } }), {} as ResourceTypesMap);

  // Type cast meta properties since global ActionMeta allows additional properties
  const permissions = meta?.permissions as string[] | undefined;
  const config = meta?.config as { page?: number; [key: string]: unknown } | undefined;

  return {
    ...state,
    resourceTypes:
      permissions?.reduce(
        (acc: PermissionsResourceTypesMap, curr: string) => ({
          ...acc,
          [curr]: config?.page && config.page > 1 ? { ...(acc?.[curr] || {}), ...data } : data,
        }),
        state.resourceTypes,
      ) || state.resourceTypes,
    total: payload.meta.count,
    isLoading: false,
  };
};

const setInventoryGroupsDetails = (state: InventoryState, action?: ReduxAction<PayloadWithResults>): InventoryState => {
  if (!action) return state;
  const { payload } = action;
  return {
    ...state,
    inventoryGroupsDetails: payload.results.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {} as InventoryGroupsDetailsMap),
    isLoading: false,
  };
};

// Reducer function map with proper typing
type ReducerFunctions = Record<string, (state: InventoryState, action?: ReduxAction<any>) => InventoryState>;

const inventoryReducer: ReducerFunctions = {
  [`${FETCH_INVENTORY_GROUPS}_PENDING`]: setLoadingState,
  [`${FETCH_INVENTORY_GROUPS}_FULFILLED`]: setResourceTypes,
  [`${FETCH_INVENTORY_GROUPS_DETAILS}_PENDING`]: setLoadingState,
  [`${FETCH_INVENTORY_GROUPS_DETAILS}_FULFILLED`]: setInventoryGroupsDetails,
};

export default inventoryReducer;
