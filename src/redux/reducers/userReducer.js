import {
  FETCH_USER,
  FETCH_USERS
} from '../../redux/ActionTypes';

// Initial State
export const usersInitialState = {
  users: [],
  user: {},
  filterValue: '',
  isUserDataLoading: false
};

const setLoadingState = state => ({ ...state, isUserDataLoading: true });
const setUsers = (state, { payload }) => ({ ...state, users: payload, isUserDataLoading: false });
const selectUser = (state, { payload }) => ({ ...state, selectedUser: payload, isUserDataLoading: false });

export default {
  [`${FETCH_USERS}_PENDING`]: setLoadingState,
  [`${FETCH_USERS}_FULFILLED`]: setUsers,
  [`${FETCH_USER}_PENDING`]: setLoadingState,
  [`${FETCH_USER}_FULFILLED`]: selectUser
};
