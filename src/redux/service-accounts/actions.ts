import { FETCH_SERVICE_ACCOUNTS } from './action-types';
import { getServiceAccounts } from './helper';

export const fetchServiceAccounts = (apiProps: Record<string, unknown>) => ({
  type: FETCH_SERVICE_ACCOUNTS,
  payload: getServiceAccounts(apiProps),
  meta: apiProps,
});
