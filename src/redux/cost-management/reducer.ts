import { FETCH_RESOURCE, FETCH_RESOURCE_DEFINITIONS } from './action-types';
import { PaginationDefaultI, defaultSettings } from '../../helpers/pagination';

// Type definitions for cost management
interface ResourceType {
  [key: string]: unknown;
}

interface ResourceTypesData {
  data: ResourceType[];
  meta: PaginationDefaultI;
}

interface ResourceItem {
  value: unknown;
  [key: string]: unknown;
}

interface ResourcesMap {
  [resourceId: string]: ResourceItem[];
}

interface ResourcePayload {
  data: ResourceItem[];
  links: {
    first: string;
    [key: string]: unknown;
  };
}

export interface CostState {
  isLoading: boolean;
  resourceTypes: ResourceTypesData;
  resources: ResourcesMap;
  loadingResources: number;
  [key: string]: unknown;
}

// Using global ReduxAction interface from store.d.ts instead of local Action interface

// Initial State
export const costInitialState: CostState = {
  isLoading: false,
  resourceTypes: {
    data: [],
    meta: defaultSettings,
  },
  resources: {},
  loadingResources: 0,
};

const setLoadingState = (state: CostState): CostState => ({ ...state, isLoading: true });

const setResourceDefinitions = (state: CostState, action?: ReduxAction<ResourceTypesData>): CostState => {
  if (!action) return state;
  const { payload } = action;
  return { ...state, resourceTypes: payload, isLoading: false };
};

const setResource = (state: CostState, action?: ReduxAction<ResourcePayload>): CostState => {
  if (!action) return state;
  const { payload } = action;
  // Extract resource ID from the first link URL - this seems to be the pattern used
  const resourceId = payload.links.first.split('/')[5];

  return {
    ...state,
    resources: {
      ...state.resources,
      [resourceId]: payload.data.filter(({ value }) => value !== null),
    },
    loadingResources: state.loadingResources - 1,
  };
};

const setResourceLoading = (state: CostState): CostState => ({
  ...state,
  loadingResources: state.loadingResources + 1,
});

// Reducer function map with proper typing
type ReducerFunctions = Record<string, (state: CostState, action?: ReduxAction<any>) => CostState>;

const costReducer: ReducerFunctions = {
  [`${FETCH_RESOURCE_DEFINITIONS}_PENDING`]: setLoadingState,
  [`${FETCH_RESOURCE_DEFINITIONS}_FULFILLED`]: setResourceDefinitions,
  [`${FETCH_RESOURCE}_PENDING`]: setResourceLoading,
  [`${FETCH_RESOURCE}_FULFILLED`]: setResource,
};

export default costReducer;
