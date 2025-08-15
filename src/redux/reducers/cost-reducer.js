import { FETCH_RESOURCE, FETCH_RESOURCE_DEFINITIONS } from '../../redux/action-types';
import { defaultSettings } from '../../helpers/shared/pagination';

// Initial State
export const costInitialState = {
  isLoading: false,
  resourceTypes: {
    data: [],
    meta: defaultSettings,
  },
  resources: {},
  loadingResources: 0,
};

const setLoadingState = (state) => ({ ...state, isLoading: true });

const setResourceDefinitions = (state, { payload }) => ({ ...state, resourceTypes: payload, isLoading: false });
const setResource = (state, { payload }) => ({
  ...state,
  resources: { ...state.resources, [payload.links.first.split('/')[5]]: payload.data.filter(({ value }) => value !== null) },
  loadingResources: state.loadingResources - 1,
});

const setResourceLoading = (state) => ({ ...state, loadingResources: state.loadingResources + 1 });

export default {
  [`${FETCH_RESOURCE_DEFINITIONS}_PENDING`]: setLoadingState,
  [`${FETCH_RESOURCE_DEFINITIONS}_FULFILLED`]: setResourceDefinitions,
  [`${FETCH_RESOURCE}_PENDING`]: setResourceLoading,
  [`${FETCH_RESOURCE}_FULFILLED`]: setResource,
};
