import * as ActionTypes from '../action-types';
import * as UserHelper from '../../helpers/user/user-helper';

export const fetchUser = () => ({
  type: ActionTypes.FETCH_USER,
  payload: new Promise(resolve => {
    resolve(UserHelper.fetchUser());
  })
});
