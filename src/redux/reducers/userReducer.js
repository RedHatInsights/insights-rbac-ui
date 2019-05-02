import { FETCH_USER } from '../../redux/ActionTypes';

// Initial State
export const usersInitialState = {
  selectedUser: {},
  isUserDataLoading: false
};

const setLoadingState = state => ({ ...state, isUserDataLoading: true });
const setUser = (state, { payload }) => ({ ...state, selectedUser: payload, isUserDataLoading: false });

export default {
  [`${FETCH_USER}_PENDING`]: setLoadingState,
  [`${FETCH_USER}_FULFILLED`]: setUser
};
