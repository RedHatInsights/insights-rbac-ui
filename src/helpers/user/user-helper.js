import { getLastPageOffset, isOffsetValid } from '../shared/pagination';
import { getPrincipalApi } from '../shared/user-login';

const principalApi = getPrincipalApi();

const principalStatusApiMap = {
  Active: 'enabled',
  Inactive: 'disabled',
  All: 'all',
};

export const baseUrl = 'https://keycloak-user-service-fips-test.apps.fips-key.2vn8.p1.openshiftapps.com';

const fetchUsersApi = async (limit, offset, matchCriteria, username, sortOrder, email, mappedStatus) => {
  let requestOpts = {
    method: 'GET',
    referrerPolicy: 'no-referrer',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
  const result = await fetch(`${baseUrl}/users?offset=${offset}&limit=${limit}`, requestOpts)
    .then((res) => res.json())
    .then((res) => {
      return { data: res?.users, meta: res?.meta };
    })
    .catch((error) => {
      return error;
    });
  return result;
};

export async function updateUser(user) {
  //TODO: this need to be replace with our api
  // await principalApi.updateUser(user.uuid, user);

  let requestOpts = {
    method: 'PUT',
    referrerPolicy: 'no-referrer',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
  
  try {
    const response = await fetch(`${baseUrl}/user/${user.id}/activate/${user.enabled}`, requestOpts)
  } catch(err) {
    alert(err);
  }
  
}

export async function fetchUsers({ limit, offset = 0, orderBy, filters = {}, inModal, matchCriteria = 'partial' }) {
  const { username, email, status = [] } = filters;
  const sortOrder = orderBy === '-username' ? 'desc' : 'asc';
  const mappedStatus =
    typeof status === 'string'
      ? principalStatusApiMap[status]
      : status.length === 2
      ? principalStatusApiMap.All
      : principalStatusApiMap[status[0]] || principalStatusApiMap.All;
  //  const response = await principalApi.listPrincipals(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);
  const response = await fetchUsersApi(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);
  const isPaginationValid = isOffsetValid(offset, response?.meta?.count);
  offset = isPaginationValid ? offset : getLastPageOffset(response.meta.count, limit);
  const { data, meta } = isPaginationValid
    ? response
    : // : await principalApi.listPrincipals(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);
      await fetchUsersApi(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);
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
