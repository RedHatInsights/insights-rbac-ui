import { getPrincipalApi } from '../shared/user-login';

const principalApi = getPrincipalApi();

const principalStatusApiMap = {
  Active: 'enabled',
  Inactive: 'disabled',
};
export async function fetchUsers({ limit, offset = 0, orderBy, filters = {}, inModal }) {
  const { username, email, status = [] } = filters;
  const sortOrder = orderBy === '-username' ? 'desc' : 'asc';
  const mappedStatus = status.length === 2 ? 'all' : principalStatusApiMap[status[0]] || 'all';
  const response = await principalApi.listPrincipals(limit, offset, undefined, username, sortOrder, email, mappedStatus);
  const isPaginationValid = offset === 0 || response.meta.count > offset;
  offset = isPaginationValid ? offset : response.meta.count - (response.meta.count % limit);
  const { data, meta } = isPaginationValid
    ? response
    : await principalApi.listPrincipals(limit, offset, undefined, username, sortOrder, email, mappedStatus);
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
