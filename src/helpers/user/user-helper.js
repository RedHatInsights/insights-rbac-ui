import { getPrincipalApi } from '../shared/user-login';

const principalApi = getPrincipalApi();

export function fetchUsers({ limit, offset, name }) {
  return principalApi.listPrincipals(limit, offset, name).then(({ data, meta }) => {
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
