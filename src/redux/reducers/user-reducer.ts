import { defaultSettings } from '../../helpers/shared/pagination';
import { FETCH_USERS, UPDATE_USERS_FILTERS } from '../action-types';

// Initial State
export const usersInitialState: UserStore = {
  selectedUser: {},
  isUserDataLoading: false,
  users: {
    meta: defaultSettings,
    filters: {},
    pagination: { ...defaultSettings, redirected: false },
  },
};

const setLoadingState = (state: any) => ({
  ...state,
  isUserDataLoading: true,
  users: {
    ...state.users,
    pagination: {
      ...state.users.pagination,
      redirected: false,
    },
  },
});

const setUsers = (state: UserStore, { payload }: any) => ({
  ...state,
  users: { pagination: state.users?.pagination, filters: state.users?.filters, ...payload },
  isUserDataLoading: false,
});

const setFilters = (state: any, { payload }: any) => ({ ...state, users: { ...state.users, filters: payload } });

export default {
  [`${FETCH_USERS}_PENDING`]: setLoadingState,
  [`${FETCH_USERS}_FULFILLED`]: setUsers,
  [UPDATE_USERS_FILTERS]: setFilters,
};
