import * as ServiceAccountsHelper from '../../helpers/service-account/service-account-helper';
import * as ActionTypes from '../action-types';

export const fetchServiceAccounts = (apiProps: Record<string, unknown>) => ({
  type: ActionTypes.FETCH_SERVICE_ACCOUNTS,
  payload: ServiceAccountsHelper.getServiceAccounts(apiProps),
  meta: apiProps,
});
