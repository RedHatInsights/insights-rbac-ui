import { getLastPageOffset, isOffsetValid } from '../shared/pagination';
import { getPrincipalApi } from '../shared/user-login';
import { isInt, isStage, isITLessProd } from '../../itLessConfig';

const principalApi = getPrincipalApi();

const principalStatusApiMap = {
  Active: 'enabled',
  Inactive: 'disabled',
  All: 'all',
};

const getBaseUrl = (url) => {
  if (isInt) {
    return url.int;
  } else if (isStage) {
    return url.stage;
  } else if (isITLessProd) {
    return url.prod;
  } else {
    return '';
  }
};

async function fetchBaseUrl() {
  try {
    // TODO move to env var defined in cluster surfaced through chrome service
    const response = await fetch('/apps/rbac/env.json');
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.log(error);
  }
}

const headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

function handleResponse(response, resolve, reject) {
  if (response.ok && response.status !== 206) {
    resolve(response);
  } else if (response.ok && response.status === 206) {
    response.json().then((body) => {
      reject(body);
    });
  } else {
    reject(response);
  }
}

function handleError(error, reject) {
  reject(new Error(error.message));
}

export async function addUsers(usersData = { emails: [], isAdmin: undefined }) {
  const requestOpts = {
    method: 'POST',
    headers,
    body: JSON.stringify({
      emails: usersData.emails,
      isAdmin: usersData.isAdmin,
    }),
  };
  const url = await fetchBaseUrl();
  const baseUrl = getBaseUrl(url);
  let promise = new Promise((resolve, reject) => {
    return fetch(`${baseUrl}/user/invite`, requestOpts)
      .then(
        (response) => handleResponse(response, resolve, reject),
        (error) => handleError(error, reject)
      )
      .catch((error) => handleError(error, reject));
  });

  return promise;
}

export async function updateUserIsOrgAdminStatus(user) {
  let requestOpts = {
    method: 'PUT',
    headers,
  };

  const url = await fetchBaseUrl();
  const baseUrl = getBaseUrl(url);

  let promise = new Promise((resolve, reject) => {
    return fetch(`${baseUrl}/user/${user.id}/admin/${user.is_org_admin}`, requestOpts)
      .then(
        (response) => handleResponse(response, resolve, reject),
        (error) => handleError(error, reject)
      )
      .catch((error) => handleError(error, reject));
  });

  return promise;
}

export async function updateUsers(users) {
  let requestOpts = {
    method: 'PUT',
    headers,
    body: JSON.stringify({ users: users }),
  };

  const url = await fetchBaseUrl();
  const baseUrl = getBaseUrl(url);

  let promise = new Promise((resolve, reject) => {
    return fetch(`${baseUrl}/change-users-status`, requestOpts)
      .then(
        (response) => handleResponse(response, resolve, reject),
        (error) => handleError(error, reject)
      )
      .catch((error) => handleError(error, reject));
  });

  return promise;
}

export async function fetchUsers({ limit, offset = 0, orderBy, filters = {}, usesMetaInURL, matchCriteria = 'partial' }) {
  const { username, email, status = [] } = filters;
  const sortOrder = orderBy === '-username' ? 'desc' : 'asc';
  const mappedStatus =
    typeof status === 'string'
      ? principalStatusApiMap[status]
      : status.length === 2
      ? principalStatusApiMap.All
      : principalStatusApiMap[status[0]] || principalStatusApiMap.All;
  const response = await principalApi.listPrincipals(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);
  const isPaginationValid = isOffsetValid(offset, response?.meta?.count);
  offset = isPaginationValid ? offset : getLastPageOffset(response.meta.count, limit);
  const { data, meta } = isPaginationValid
    ? response
    : await principalApi.listPrincipals(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);
  return {
    data,
    meta: {
      ...meta,
      offset,
      limit,
    },
    ...(usesMetaInURL
      ? {
          filters,
          pagination: {
            ...meta,
            offset,
            limit,
            redirected: !isPaginationValid,
          },
        }
      : {}),
  };
}
