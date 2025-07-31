import { ERROR, RESULTS } from './constants';
import { ServiceAccount, ServiceAccountsPayload } from './types';
import { defaultCompactSettings } from '../../helpers/pagination';
import { FETCH_SERVICE_ACCOUNTS } from './action-types';

export interface ServiceAccountsState extends Record<string, unknown> {
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

const setLoadingState = (state: ServiceAccountsState): ServiceAccountsState => ({
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
  },
): ServiceAccountsState => ({
  ...state,
  limit: meta.limit,
  offset: meta.offset,
  serviceAccounts: payload.data,
  status: payload.status,
  isLoading: false,
});

const setErrorState = (state: ServiceAccountsState): ServiceAccountsState => {
  return {
    ...state,
    isLoading: false,
    status: ERROR,
    serviceAccounts: [], // Clear any existing data on error
  };
};

export default {
  [`${FETCH_SERVICE_ACCOUNTS}_PENDING`]: setLoadingState,
  [`${FETCH_SERVICE_ACCOUNTS}_FULFILLED`]: setServiceAccounts,
  [`${FETCH_SERVICE_ACCOUNTS}_REJECTED`]: setErrorState,
};
