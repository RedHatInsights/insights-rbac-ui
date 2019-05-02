import * as ActionTypes from '../ActionTypes';
import * as UserHelper from '../../Helpers/User/UserHelper';

export const fetchUser = () => ({
  type: ActionTypes.FETCH_USER,
  payload: new Promise(resolve => {
    resolve(UserHelper.fetchUser());
  })
});
