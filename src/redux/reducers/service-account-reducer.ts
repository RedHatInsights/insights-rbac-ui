import { RESULTS, ServiceAccount, ServiceAccountsPayload } from '../../helpers/service-account/service-account-helper';
import { defaultCompactSettings } from '../../helpers/shared/pagination';
import { FETCH_SERVICE_ACCOUNTS } from '../action-types';

export interface ServiceAccountsState {
  isLoading: boolean;
  status: string;
  serviceAccounts: ServiceAccount[];
  limit: number;
  offset: number;
}

// Initial State
export const serviceAccountsInitialState: ServiceAccountsState = {
  offset: 0,
  limit: defaultCompactSettings.limit,
  isLoading: false,
  serviceAccounts: [],
  status: RESULTS,
};

const setLoadingState = (state: ServiceAccountsState) => ({
  ...state,
  isLoading: true,
});

const setServiceAccounts = (
  state: ServiceAccountsState,
  {
    payload,
    meta,
  }: {
    payload: ServiceAccountsPayload;
    meta: Pick<ServiceAccountsState, 'limit' | 'offset'>;
  }
) => ({
  ...state,
  limit: meta.limit,
  offset: meta.offset,
  serviceAccounts: payload.data,
  status: payload.status,
  isLoading: false,
});

export default {
  [`${FETCH_SERVICE_ACCOUNTS}_PENDING`]: setLoadingState,
  [`${FETCH_SERVICE_ACCOUNTS}_FULFILLED`]: setServiceAccounts,
};
