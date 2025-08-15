import { fetchAccountsForGroup } from '../group/group-helper';
import { defaultCompactSettings } from '../shared/pagination';
import { getServiceAccountsApi } from '../shared/user-login';
import { LAST_PAGE, NO_DATA, RESULTS } from './constants';
import { ServiceAccountPayloadItem } from './types';

const serviceAccountsApi = getServiceAccountsApi?.();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getServiceAccounts({ limit = defaultCompactSettings.limit, offset = 0, token, sso, groupId }: any) {
  const page = Math.trunc(offset / limit) + 1;
  const perPage = limit;

  const response = await serviceAccountsApi.getServiceAccounts(page, perPage, token, sso);

  let assignedServiceAccounts: string[] = [];
  if (groupId && response.data.length > 0) {
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
