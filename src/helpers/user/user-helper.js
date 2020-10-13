import { getPrincipalApi } from '../shared/user-login';

const principalApi = getPrincipalApi();

const principalStatusApiMap = {
  Active: 'enabled',
  Inactive: 'disabled',
};

const orgAdminMap = {
  Yes: 'true',
  No: 'false',
};

export function fetchUsers({ limit, offset, username, orderBy, email, status = [], orgAdmin = [] }) {
  const sortOrder = orderBy === '-username' ? 'desc' : 'asc';
  const mappedStatus = status.length === 2 ? 'all' : principalStatusApiMap[status[0]] || 'all';
  const adminOnly = orgAdmin.length === 2 ? undefined : orgAdminMap[orgAdmin[0]];
  return principalApi.listPrincipals(limit, offset, username, sortOrder, email, mappedStatus, adminOnly).then(({ data, meta }) => {
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
