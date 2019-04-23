import { FETCH_USERS } from '../../redux/ActionTypes';

// Initial State
export const usersInitialState = {
  users: [],
  user: {},
  isUserDataLoading: false
};

const setLoadingState = state => ({ ...state, isUserDataLoading: true });
const setUsers = (state, { payload }) => ({ ...state, users: payload, isUserDataLoading: false });

export default {
  [`${FETCH_USERS}_PENDING`]: setLoadingState,
  [`${FETCH_USERS}_FULFILLED`]: setUsers
};
