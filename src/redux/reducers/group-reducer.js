import {
  FETCH_GROUP,
  FETCH_GROUPS
} from '../../redux/action-types';

// Initial State
export const groupsInitialState = {
  groups: {
    data: [],
    meta: {
      count: 0,
      limit: 10,
      offset: 0
    }
  },
  group: {},
  isLoading: false
};

const setLoadingState = state => ({ ...state, isLoading: true });
const setGroups = (state, { payload }) => ({ ...state, groups: payload, isLoading: false });
const selectGroup = (state, { payload }) => ({ ...state, selectedGroup: payload, isLoading: false });

export default {
  [`${FETCH_GROUPS}_PENDING`]: setLoadingState,
  [`${FETCH_GROUPS}_FULFILLED`]: setGroups,
  [`${FETCH_GROUP}_PENDING`]: setLoadingState,
  [`${FETCH_GROUP}_FULFILLED`]: selectGroup
};
