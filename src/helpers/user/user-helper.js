import { getPrincipalApi } from '../shared/user-login';

const principalApi = getPrincipalApi();

export function fetchUsers({ limit, offset, username, orderBy, email }) {
  const sortOrder = orderBy === '-username' ? ('desc') : ('asc');
  return principalApi.listPrincipals(limit, offset, username, sortOrder, email).then(({ data, meta }) => {
    return {
      data,
      meta: {
        ...meta,
        offset,
        limit
      }
    };
  });
}
