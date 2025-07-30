import { PaginationDefaultI, defaultSettings } from '../../helpers/pagination';
import { ERROR, FETCH_USERS, UPDATE_USERS_FILTERS } from './action-types';

export interface User {
  email: string;
  external_source_id: number;
  first_name: string;
  id?: string | number; // Added to support component usage
  is_active: boolean;
  is_org_admin: boolean;
  last_name: string;
  username: string;
  uuid?: number;
}

export interface UserFilters {
  username?: string;
  email?: string;
  status?: string[];
}

// Action payload interfaces
interface FetchUsersPayload {
  meta: PaginationDefaultI;
  data?: User[];
}

interface FetchUsersAction {
  type: string;
  payload: FetchUsersPayload;
}

interface UpdateFiltersAction {
  type: string;
  payload: UserFilters;
}

export interface UserStore extends Record<string, unknown> {
  selectedUser: Record<string, unknown>;
  isUserDataLoading: boolean;
  status?: string;
  users: {
    meta: PaginationDefaultI;
    filters: UserFilters;
    pagination: PaginationDefaultI & { redirected?: boolean };
    data?: User[];
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

const setLoadingState = (state: UserStore): UserStore => ({
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

const setUsers = (state: UserStore, { payload }: FetchUsersAction): UserStore => ({
  ...state,
  users: { pagination: state.users?.pagination, filters: state.users?.filters, ...payload },
  isUserDataLoading: false,
});

const setFilters = (state: UserStore, { payload }: UpdateFiltersAction): UserStore => ({
  ...state,
  users: { ...state.users, filters: payload },
});

const setErrorState = (state: UserStore): UserStore => {
  return {
    ...state,
    isUserDataLoading: false,
    status: ERROR,
    users: {
      ...state.users,
      data: [], // Clear any existing data on error
    },
  };
};

export default {
  [`${FETCH_USERS}_PENDING`]: setLoadingState,
  [`${FETCH_USERS}_FULFILLED`]: setUsers,
  [`${FETCH_USERS}_REJECTED`]: setErrorState,
  [UPDATE_USERS_FILTERS]: setFilters,
};
