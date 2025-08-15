import { getLastPageOffset, isOffsetValid } from '../shared/pagination';
import { getPrincipalApi } from '../shared/user-login';
import { isITLessProd, isInt, isStage } from '../../itLessConfig';

export const MANAGE_SUBSCRIPTIONS_VIEW_EDIT_USER = 'view-edit-user';
export const MANAGE_SUBSCRIPTIONS_VIEW_ALL = 'view-all';
export const MANAGE_SUBSCRIPTIONS_VIEW_EDIT_ALL = 'view-edit-all';

const getITApiUrl = (isProd) => `https://api.access${isProd ? '' : '.stage'}.redhat.com`;

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

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${token}`,
});

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

export async function addUsers(usersData = { emails: [], isAdmin: undefined, message: undefined }, config) {
  if (config) {
    const currURL = `${getITApiUrl(config.isProd)}/account/v1/accounts/${config.accountId}/users/invite`;
    return fetch(currURL, {
      body: JSON.stringify({
        emails: usersData.emails,
        localeCode: 'en',
        ...(usersData.isAdmin && { roles: ['organization_administrator'] }),
      }),
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      }),
    });
  }
  const token = await insights.chrome.auth.getToken();
  const requestOpts = {
    method: 'POST',
    headers: getHeaders(token),
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
        (error) => handleError(error, reject),
      )
      .catch((error) => handleError(error, reject));
  });

  return promise;
}

export async function updateUserIsOrgAdminStatus(user, config) {
  if (config) {
    const currURL = `${getITApiUrl(config.isProd)}/account/v1/accounts/${config.accountId}/users/${user.id}/roles`;
    return fetch(currURL, {
      method: user.is_org_admin ? 'POST' : 'DELETE',
      body: JSON.stringify({
        role: 'organization_administrator',
      }),
      headers: new Headers({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      }),
    });
  }
  const token = await insights.chrome.auth.getToken();
  let requestOpts = {
    method: 'PUT',
    headers: getHeaders(token),
  };

  const url = await fetchBaseUrl();
  const baseUrl = getBaseUrl(url);

  let promise = new Promise((resolve, reject) => {
    return fetch(`${baseUrl}/user/${user.id}/admin/${user.is_org_admin}`, requestOpts)
      .then(
        (response) => handleResponse(response, resolve, reject),
        (error) => handleError(error, reject),
      )
      .catch((error) => handleError(error, reject));
  });

  return promise;
}

export async function changeUsersStatus(users, config) {
  if (config) {
    return users.map((user) => {
      const currURL = `${getITApiUrl(config.isProd)}/account/v1/accounts/${config.accountId}/users/${user.id}/status`;
      return fetch(currURL, {
        method: 'POST',
        body: JSON.stringify({
          status: user.is_active ? 'enabled' : 'disabled',
        }),
        headers: new Headers({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.token}`,
        }),
      });
    });
  }
  const token = await insights.chrome.auth.getToken();
  let requestOpts = {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify({ users: users }),
  };

  const url = await fetchBaseUrl();
  const baseUrl = getBaseUrl(url);

  let promise = new Promise((resolve, reject) => {
    return fetch(`${baseUrl}/change-users-status`, requestOpts)
      .then(
        (response) => handleResponse(response, resolve, reject),
        (error) => handleError(error, reject),
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
