import { getPrincipalApi } from '../shared/user-login';

const principalApi = getPrincipalApi();

const principalStatusApiMap = {
  active: 'enabled',
  inactive: 'disabled',
};
export function fetchUsers({ limit, offset, username, orderBy, email, status = [] }) {
  const sortOrder = orderBy === '-username' ? 'desc' : 'asc';
  const mappedStatus = status.length === 2 ? 'all' : principalStatusApiMap[status[0]];
  return principalApi.listPrincipals(limit, offset, username, sortOrder, email, mappedStatus).then(({ data, meta }) => {
    return {
      data,
      meta: {
        ...meta,
        offset,
        limit,
      },
    };
  });
}
