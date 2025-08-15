import * as ActionTypes from '../action-types';
import * as ServiceAccountsHelper from '../../helpers/service-account/service-account-helper';

export const fetchServiceAccounts = (apiProps: Record<string, unknown>) => ({
  type: ActionTypes.FETCH_SERVICE_ACCOUNTS,
  payload: ServiceAccountsHelper.getServiceAccounts(apiProps),
  meta: apiProps,
});
