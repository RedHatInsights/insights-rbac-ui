import {
  FETCH_USER,
  ADD_USER,
  FETCH_USERS
} from '../../redux/ActionTypes';

// Initial State
export const usersInitialState = {
  users: [],
  user: {},
  isLoading: false
};

const setLoadingState = state => ({ ...state, isLoading: true });
const setUsers = (state, { payload }) => ({ ...state, users: payload, isLoading: false });
const selectUser = (state, { payload }) => ({ ...state, selectedUser: payload, isLoading: false });

export default {
  [`${FETCH_USERS}_PENDING`]: setLoadingState,
  [`${FETCH_USERS}_FULFILLED`]: setUsers,
  [`${FETCH_USER}_PENDING`]: setLoadingState,
  [`${FETCH_USER}_FULFILLED`]: selectUser
};
