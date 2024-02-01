import { defaultCompactSettings } from '../shared/pagination';
import { getServiceAccountsApi } from '../shared/user-login';

const serviceAccountsApi = getServiceAccountsApi?.();

export const NO_DATA = 'no-data';
export const LAST_PAGE = 'last-page';
export const RESULTS = 'results';

export interface ServiceAccountPayloadItem {
  id: string;
  clientId: string;
  name: string;
  createdBy: string;
  createdAt: number;
}

export interface ServiceAccount {
  uuid: string;
  clientId: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: number;
}

export interface ServiceAccountsPayload {
  data: ServiceAccount[];
  status: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServiceAccounts({ limit = defaultCompactSettings.limit, offset = 0, token, sso }: any) {
  const page = Math.trunc(offset / limit) + 1;
  const perPage = limit;

  const response = await serviceAccountsApi.getServiceAccounts(page, perPage, token, sso);

  let status;
  if (page === 1 && response.data.length === 0) {
    status = NO_DATA;
  } else {
    status = response.data.length < perPage + 1 ? LAST_PAGE : RESULTS;
  }

  return {
    data: response.data
      .slice(0, perPage)
      .map(({ id, createdAt, ...item }: ServiceAccountPayloadItem) => ({ uuid: id, createdAt: createdAt * 1000, ...item })),
    status,
  };
}
