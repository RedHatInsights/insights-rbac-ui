import { FETCH_USERS, UPDATE_USERS_FILTERS } from '../action-types';
import { defaultSettings, PaginationDefaultI } from '../../helpers/shared/pagination';

export interface UserStore {
  selectedUser: Record<string, unknown>;
  isUserDataLoading: boolean;
  users: {
    meta: PaginationDefaultI;
    filters: Record<string, any>;
    pagination: PaginationDefaultI & { redirected?: boolean };
    data?: any;
  };
}

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

const setUsers = (state: UserStore, { payload }: any) => ({ ...state, users: { ...state.users, ...payload }, isUserDataLoading: false });

const setFilters = (state: any, { payload }: any) => ({ ...state, users: { ...state.users, filters: payload } });

export default {
  [`${FETCH_USERS}_PENDING`]: setLoadingState,
  [`${FETCH_USERS}_FULFILLED`]: setUsers,
  [UPDATE_USERS_FILTERS]: setFilters,
};
