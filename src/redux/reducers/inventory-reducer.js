import { FETCH_INVENTORY_GROUP } from '../action-types';
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

export default {
  [`${FETCH_INVENTORY_GROUP}_PENDING`]: setLoadingState,
  [`${FETCH_INVENTORY_GROUP}_FULFILLED`]: setResourceTypes,
};
