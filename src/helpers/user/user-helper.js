import { getLastPageOffset, isOffsetValid } from '../shared/pagination';
import { getPrincipalApi } from '../shared/user-login';

const principalApi = getPrincipalApi();

const principalStatusApiMap = {
  Active: 'enabled',
  Inactive: 'disabled',
  All: 'all',
};
export async function fetchUsers({ limit, offset = 0, orderBy, filters = {}, inModal, matchCriteria = 'partial' }) {
  const { username, email, status = [] } = filters;
  const sortOrder = orderBy === '-username' ? 'desc' : 'asc';
  const mappedStatus =
    typeof status === 'string'
      ? principalStatusApiMap[status]
      : status.length === 2
      ? principalStatusApiMap.All
      : principalStatusApiMap[status[0]] || principalStatusApiMap.All;
  const response = await principalApi.listPrincipals(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);
  const isPaginationValid = isOffsetValid(offset, response?.meta?.count);
  offset = isPaginationValid ? offset : getLastPageOffset(response.meta.count, limit);
  const { data, meta } = isPaginationValid
    ? response
    : await principalApi.listPrincipals(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);
  return {
    data,
    meta: {
      ...meta,
      offset,
      limit,
    },
    ...(inModal
      ? {}
      : {
          filters,
          pagination: {
            ...meta,
            offset,
            limit,
            redirected: !isPaginationValid,
          },
        }),
  };
}
