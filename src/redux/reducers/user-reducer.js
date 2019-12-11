import { FETCH_USER, FETCH_USERS } from '../../redux/action-types';

// Initial State
export const usersInitialState = {
  selectedUser: {},
  isUserDataLoading: false,
  users: []
};

const setLoadingState = state => ({ ...state, isUserDataLoading: true });

const setUser = (state, { payload }) => ({ ...state, selectedUser: payload, isUserDataLoading: false });
const setUsers = (state, { payload }) => ({ ...state, users: payload, isUserDataLoading: false });

export default {
  [`${FETCH_USER}_PENDING`]: setLoadingState,
  [`${FETCH_USER}_FULFILLED`]: setUser,
  [`${FETCH_USERS}_PENDING`]: setLoadingState,
  [`${FETCH_USERS}_FULFILLED`]: setUsers
};
