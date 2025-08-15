import { FETCH_INVENTORY_GROUPS, FETCH_INVENTORY_GROUPS_DETAILS } from '../action-types';

export const inventoryGroupsInitialState = {
  isLoading: false,
  resourceTypes: {},
  inventoryGroupsDetails: {},
  total: 0,
};

const setLoadingState = (state) => ({ ...state, isLoading: true });

const setResourceTypes = (state, { payload, meta }) => {
  const data = payload.data.reduce((acc, curr) => ({ ...acc, [curr.name]: { ...curr } }), {});
  return {
    ...state,
    resourceTypes: meta.permissions?.reduce(
      (acc, curr) => ({
        ...acc,
        [curr]: meta?.config?.page > 1 ? { ...(acc?.[curr] || {}), ...data } : data,
      }),
      state.resourceTypes,
    ),
    total: payload.meta.count,
    isLoading: false,
  };
};

const setInventoryGroupsDetails = (state, { payload }) => {
  return {
    ...state,
    inventoryGroupsDetails: payload.results.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {}),
    isLoading: false,
  };
};

export default {
  [`${FETCH_INVENTORY_GROUPS}_PENDING`]: setLoadingState,
  [`${FETCH_INVENTORY_GROUPS}_FULFILLED`]: setResourceTypes,
  [`${FETCH_INVENTORY_GROUPS_DETAILS}_PENDING`]: setLoadingState,
  [`${FETCH_INVENTORY_GROUPS_DETAILS}_FULFILLED`]: setInventoryGroupsDetails,
};
