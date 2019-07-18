import {
  FETCH_ROLE,
  FETCH_ROLES
} from '../../redux/action-types';

// Initial State
export const rolesInitialState = {
  roles: {
    data: [],
    meta: {
      count: 0,
      limit: 10,
      offset: 0
    }
  },
  role: {},
  isLoading: false
};

const setLoadingState = state => ({ ...state, isLoading: true });
const setRoles = (state, { payload }) => ({ ...state, roles: payload, isLoading: false });
const selectRole = (state, { payload }) => ({ ...state, selectedRole: payload, isLoading: false });

export default {
  [`${FETCH_ROLES}_PENDING`]: setLoadingState,
  [`${FETCH_ROLES}_FULFILLED`]: setRoles,
  [`${FETCH_ROLE}_PENDING`]: setLoadingState,
  [`${FETCH_ROLE}_FULFILLED`]: selectRole
};
