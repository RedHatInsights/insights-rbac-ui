import * as ActionTypes from '../action-types';
import * as AccessHelper from '../../helpers/access/access-helper';

export const getPrincipalAccess = (apiProps) => ({
  type: ActionTypes.GET_PRINCIPAL_ACCESS,
  payload: AccessHelper.getPrincipalAccess(apiProps),
});
