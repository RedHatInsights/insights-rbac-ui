import * as ActionTypes from '../ActionTypes';
import * as UserHelper from '../../Helpers/User/UserHelper';

export const fetchUsers = () => ({
  type: ActionTypes.FETCH_USERS,
  payload: new Promise(resolve => {
    resolve(UserHelper.fetchUsers());
  })
});
