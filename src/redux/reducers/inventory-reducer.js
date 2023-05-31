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

const setResourceTypes = (state, { payload }) => ({
  ...state,
  resourceTypes: {
    ...state.resourceTypes,
    data: payload.results,
  },
  isLoading: false,
});

const setResource = (state, { payload }) => ({
  ...state,
  resources: { ...state.resources, [payload.links.first.split('/')[5]]: payload.data.filter(({ value }) => value !== null) },
  loadingResources: state.loadingResources - 1,
});

const setResourceLoading = (state) => ({ ...state, loadingResources: state.loadingResources + 1 });

export default {
  [`${FETCH_INVENTORY_GROUP}_PENDING`]: setLoadingState,
  [`${FETCH_INVENTORY_GROUP}_FULFILLED`]: setResourceTypes,
  [`${FETCH_INVENTORY_GROUP_RESOURCES}_PENDING`]: setResourceLoading,
  [`${FETCH_INVENTORY_GROUP_RESOURCES}_FULFILLED`]: setResource,
};
