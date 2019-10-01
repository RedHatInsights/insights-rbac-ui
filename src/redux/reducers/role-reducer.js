import {
  FETCH_ROLE,
  FETCH_ROLES
} from '../../redux/action-types';

// Initial State
export const rolesInitialState = {
  isLoading: false,
  isRecordLoading: false,
  roles: {
    data: [],
    meta: {
      count: 0,
      limit: 10,
      offset: 0
    }
  },
  selectedRole: {}
};

const setLoadingState = state => ({ ...state, isLoading: true });
const setRecordLoadingState = state => ({ ...state, isRecordLoading: true });
const setRole = (state, { payload }) => ({ ...state, selectedRole: payload, isRecordLoading: false });
const setRoles = (state, { payload }) => ({ ...state, roles: payload, isLoading: false });

export default {
  [`${FETCH_ROLE}_FULFILLED`]: setRole,
  [`${FETCH_ROLE}_PENDING`]: setRecordLoadingState,
  [`${FETCH_ROLES}_FULFILLED`]: setRoles,
  [`${FETCH_ROLES}_PENDING`]: setLoadingState
};
