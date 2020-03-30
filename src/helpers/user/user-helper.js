import { getPrincipalApi } from '../shared/user-login';

const principalApi = getPrincipalApi();

export function fetchUsers({ limit, offset, name, orderBy }) {
  const sortOrder = orderBy === '-username' ? ('desc') : ('asc');
  return principalApi.listPrincipals(limit, offset, name, sortOrder).then(({ data, meta }) => {
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
