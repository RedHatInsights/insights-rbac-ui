import { fetchAccountsForGroup } from '../group/group-helper';
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
  description: string;
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
  assignedToSelectedGroup: boolean;
}

export interface ServiceAccountsPayload {
  data: ServiceAccount[];
  status: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServiceAccounts({ limit = defaultCompactSettings.limit, offset = 0, token, sso, groupId }: any) {
  const page = Math.trunc(offset / limit) + 1;
  const perPage = limit;

  const response = await serviceAccountsApi.getServiceAccounts(page, perPage, token, sso);

  let assignedServiceAccounts: string[] = [];
  if (groupId) {
    const serviceAccountClientIds = response.data.map((item: ServiceAccountPayloadItem) => item.clientId);
    const assignedAccountsTemp = (await fetchAccountsForGroup(groupId, { serviceAccountClientIds: serviceAccountClientIds.toString() }))
      .data as Record<string, boolean>;
    assignedServiceAccounts = Object.keys(assignedAccountsTemp).filter((key) => assignedAccountsTemp?.[key]);
  }

  let status;
  if (page === 1 && response.data.length === 0) {
    status = NO_DATA;
  } else {
    status = response.data.length < perPage + 1 ? LAST_PAGE : RESULTS;
  }

  return {
    data: response.data.slice(0, perPage).map(({ id, createdAt, ...item }: ServiceAccountPayloadItem) => ({
      uuid: id,
      createdAt: createdAt * 1000,
      assignedToSelectedGroup: groupId ? assignedServiceAccounts.includes(id) : undefined,
      ...item,
    })),
    status,
  };
}
