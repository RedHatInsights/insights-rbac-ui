import { getLastPageOffset, isOffsetValid } from '../shared/pagination';
import { getPrincipalApi } from '../shared/user-login';
import lodash from 'lodash';

const principalApi = getPrincipalApi();

const principalStatusApiMap = {
  Active: 'enabled',
  Inactive: 'disabled',
  All: 'all',
};

export const baseUrl = 'https://keycloak-user-service-fips-test.apps.fips-key.2vn8.p1.openshiftapps.com';

const fetchUsersApi = async (limit, offset, matchCriteria, username, sortOrder, email, mappedStatus) => {
  const token = await insights.chrome.auth.getToken();

  const requestOpts = {
    method: 'GET',
    referrerPolicy: 'no-referrer',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
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

export async function addUsers(usersData = { emails: [], isAdmin: undefined }) {
  const token = await insights.chrome.auth.getToken();
  const requestOpts = {
    method: 'PUT',
    referrerPolicy: 'no-referrer',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      emails: usersData.emails,
      isAdmin: usersData.isAdmin,
    }),
  };

  let promise = new Promise((resolve, reject) => {
    return fetch(`${baseUrl}/user/invite`, requestOpts)
      .then(
        (response) => {
          if (response.ok) {
            resolve(response);
          } else {
            reject(response);
          }
        },
        (error) => {
          reject(new Error(error.message));
        }
      )
      .catch((err) => {
        reject(new Error(err.message));
      });
  });

  return promise;
}

export async function updateUsers(users) {
  //TODO: this need to be replace with our api
  // await principalApi.updateUser(user.uuid, user);
  const token = await insights.chrome.auth.getToken();
  let requestOpts = {
    method: 'PUT',
    referrerPolicy: 'no-referrer',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ users: users }),
  };

  let promise = new Promise((resolve, reject) => {
    return fetch(`${baseUrl}/change-users-status`, requestOpts)
      .then(
        (response) => {
          if (response.ok) {
            resolve(response);
          } else {
            reject(response);
          }
        },
        (error) => {
          reject(new Error(error.message));
        }
      )
      .catch((err) => {
        reject(new Error(err.message));
      });
  });

  return promise;
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
  const response = await principalApi.listPrincipals(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);
  // const response = await fetchUsersApi(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);
  const isPaginationValid = isOffsetValid(offset, response?.meta?.count);
  offset = isPaginationValid ? offset : getLastPageOffset(response.meta.count, limit);
  const { data, meta } = isPaginationValid
    ? response
    : await principalApi.listPrincipals(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);
  // : await fetchUsersApi(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);
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
