import { getPrincipalApi } from '../shared/user-login';

const principalApi = getPrincipalApi();

const principalStatusApiMap = {
  Active: 'enabled',
  Inactive: 'disabled',
};
export function fetchUsers({ limit, offset, orderBy, filters = {}, inModal }) {
  const { username, email, status = [] } = filters;
  const sortOrder = orderBy === '-username' ? 'desc' : 'asc';
  const mappedStatus = status.length === 2 ? 'all' : principalStatusApiMap[status[0]] || 'all';
  return principalApi.listPrincipals(limit, offset, undefined, username, sortOrder, email, mappedStatus).then(({ data, meta }) => {
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
            },
          }),
    };
  });
}
