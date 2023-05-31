import { FETCH_INVENTORY_GROUP, FETCH_INVENTORY_GROUP_RESOURCES } from '../action-types';
import { defaultSettings } from '../../helpers/shared/pagination';

export const inventoryGroupsInitialState = {
  isLoading: false,
  resourceTypes: {
    data: [],
    meta: defaultSettings,
  },
  resources: {},
  loadingResources: 0,
};

const setLoadingState = (state) => ({ ...state, isLoading: true });

// Saving the inventory-groups
const setResourceTypes = (state, { payload }) => ({
  ...state,
  resourceTypes: {
    ...state.resourceTypes,
    data: payload.results,
  },
  isLoading: false,
});

// Need to figure out what we do with this
const setResource = (state, { payload }) => ({
  ...state,
  // resources: { ...state.resources, [payload.links.first.split('/')[5]]:payload.data.filter(({ value }) => value !== null) }, // This might be related to the hosts in inventory (resource types)
  resources: { ...state.resources, [payload.links.first.split('/')[5]]: payload.data.filter(({ value }) => value !== null) }, // This might be related to the hosts in inventory (resource types)
  loadingResources: state.loadingResources - 1,
});

const setResourceLoading = (state) => ({ ...state, loadingResources: state.loadingResources + 1 });

export default {
  [`${FETCH_INVENTORY_GROUP}_PENDING`]: setLoadingState,
  [`${FETCH_INVENTORY_GROUP}_FULFILLED`]: setResourceTypes,
  [`${FETCH_INVENTORY_GROUP_RESOURCES}_PENDING`]: setResourceLoading, // TODO: Rename to group_hosts instead of resources
  [`${FETCH_INVENTORY_GROUP_RESOURCES}_FULFILLED`]: setResource, //       once the granularity is confirmed.
};
