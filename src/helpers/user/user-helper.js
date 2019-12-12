import { getPrincipalApi } from '../shared/user-login';

const principalApi = getPrincipalApi();

export function fetchUsers({ limit, offset, name }) {
  return principalApi.listPrincipals(limit + 1, offset, name).then(({ data, meta }) => {
    const isLast = !data || data.length <= limit;
    const currData = data.slice(0, limit);
    return {
      data: currData,
      meta: {
        ...meta,
        offset,
        limit,
        count: meta.count === null ? (!isLast ? Infinity : ((offset || 0) + currData.length)) : meta.count
      }
    };
  });
}
