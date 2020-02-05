import { FETCH_USERS } from '../../redux/action-types';

// Initial State
export const usersInitialState = {
  selectedUser: {},
  isUserDataLoading: false,
  users: []
};

const setLoadingState = state => ({ ...state, isUserDataLoading: true });

const setUsers = (state, { payload }) => ({ ...state, users: payload, isUserDataLoading: false });

export default {
  [`${FETCH_USERS}_PENDING`]: setLoadingState,
  [`${FETCH_USERS}_FULFILLED`]: setUsers
};
