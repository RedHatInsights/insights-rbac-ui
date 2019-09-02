import {
  FETCH_POLICY,
  FETCH_GROUP_POLICIES
} from '../../redux/action-types';

// Initial State
export const policiesInitialState = {
  policies: {
    data: [],
    meta: {
      count: 0,
      limit: 10,
      offset: 0
    }
  },
  policy: {},
  isLoading: false
};

const setLoadingState = state => ({ ...state, isLoading: true });
const setPolicies = (state, { payload }) => ({ ...state, policies: payload, isLoading: false });
const selectPolicy = (state, { payload }) => ({ ...state, selectedPolicy: payload, isLoading: false });

export default {
  [`${FETCH_GROUP_POLICIES}_PENDING`]: setLoadingState,
  [`${FETCH_GROUP_POLICIES}_FULFILLED`]: setPolicies,
  [`${FETCH_POLICY}_PENDING`]: setLoadingState,
  [`${FETCH_POLICY}_FULFILLED`]: selectPolicy
};
