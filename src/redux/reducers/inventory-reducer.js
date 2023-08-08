import { FETCH_INVENTORY_GROUP } from '../action-types';

export const inventoryGroupsInitialState = {
  isLoading: false,
  resourceTypes: {},
  total: 0,
};

const setLoadingState = (state) => ({ ...state, isLoading: true });

const setResourceTypes = (state, { payload, meta }) => {
  const data = payload.data.reduce((acc, curr) => ({ ...acc, [curr.name]: { ...curr } }), {});
  return {
    ...state,
    resourceTypes: meta.permissions.reduce(
      (acc, curr) => ({
        ...acc,
        [curr]: meta?.config?.page > 1 ? { ...(acc?.[curr] || {}), ...data } : data,
      }),
      state.resourceTypes
    ),
    total: payload.meta?.count,
    isLoading: false,
  };
};

export default {
  [`${FETCH_INVENTORY_GROUP}_PENDING`]: setLoadingState,
  [`${FETCH_INVENTORY_GROUP}_FULFILLED`]: setResourceTypes,
};
