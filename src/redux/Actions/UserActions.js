import * as ActionTypes from '../ActionTypes';
import * as UserHelper from '../../Helpers/User/UserHelper';

const doFetchUsers = () => ({
  type: ActionTypes.FETCH_USERS,
  payload: new Promise(resolve => {
    resolve(UserHelper.fetchUsers());
  })
});

export const fetchUsers = () => (dispatch, getState) => {
  const { userReducer: { isUserDataLoading }} = getState();
  if (!isUserDataLoading) {
    return dispatch(doFetchUsers());
  }
};

export const fetchSelectedUser = id => ({
  type: ActionTypes.FETCH_USER,
  payload: new Promise(resolve => {
    resolve(UserHelper.fetchUser(id));
  })
});

export const searchUserItems = value => ({
  type: ActionTypes.FILTER_USER_ITEMS,
  payload: new Promise(resolve => {
    resolve(value);
  })
});
