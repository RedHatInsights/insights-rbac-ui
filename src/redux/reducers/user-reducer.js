import { FETCH_USERS, UPDATE_USERS_FILTERS } from '../../redux/action-types';
import { defaultSettings } from '../../helpers/shared/pagination';

// Initial State
export const usersInitialState = {
  selectedUser: {},
  isUserDataLoading: false,
  users: {
    meta: defaultSettings,
    filters: {},
    pagination: defaultSettings,
  },
};

const setLoadingState = (state) => ({ ...state, isUserDataLoading: true });

const setUsers = (state, { payload }) => ({ ...state, users: { ...state.users, ...payload }, isUserDataLoading: false });

const setFilters = (state, { payload }) => ({ ...state, users: { ...state.users, filters: payload } });

export default {
  [`${FETCH_USERS}_PENDING`]: setLoadingState,
  [`${FETCH_USERS}_FULFILLED`]: setUsers,
  [UPDATE_USERS_FILTERS]: setFilters,
};
