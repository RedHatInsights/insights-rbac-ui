import { Principal } from '@redhat-cloud-services/rbac-client/types';
import { isInt, isITLessProd, isStage } from '../../itLessConfig';
import { getLastPageOffset, isOffsetValid } from '../shared/pagination';
import { getPrincipalApi } from '../shared/user-login';

export type ActionConfig = {
  isProd: boolean;
  token?: string | null;
  accountId?: string | null;
};

export const MANAGE_SUBSCRIPTIONS_VIEW_EDIT_USER = 'view-edit-user';
export const MANAGE_SUBSCRIPTIONS_VIEW_ALL = 'view-all';
export const MANAGE_SUBSCRIPTIONS_VIEW_EDIT_ALL = 'view-edit-all';

interface EnvUrls {
  int: string;
  stage: string;
  prod: string;

  [key: string]: string;
}

interface FetchResponse {
  meta?: {
    count: number;
  };
  data: User[];
}

const getITApiUrl = (isProd: boolean): string => `https://api.access${isProd ? '' : '.stage'}.redhat.com`;

const principalApi = getPrincipalApi();

const getBaseUrl = (url: EnvUrls): string => {
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

async function fetchBaseUrl(): Promise<EnvUrls> {
  try {
    // TODO move to env var defined in cluster surfaced through chrome service
    const response = await fetch('/apps/rbac/env.json');
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

const getHeaders = (token: string | undefined = 'unknown'): HeadersInit => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${token}`,
});

function handleResponse(response: Response, resolve: (value: Response) => void, reject: (reason?: any) => void): void {
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

function handleError(error: Error, reject: (reason?: any) => void): void {
  reject(new Error(error.message));
}

export type AddUsersData = {
  emails: string[];
  isAdmin?: boolean;
  message?: string;
  portal_manage_cases?: boolean;
  portal_download?: boolean;
  portal_manage_subscriptions?:
    | typeof MANAGE_SUBSCRIPTIONS_VIEW_EDIT_USER
    | typeof MANAGE_SUBSCRIPTIONS_VIEW_ALL
    | typeof MANAGE_SUBSCRIPTIONS_VIEW_EDIT_ALL;
};

export async function addUsers(
  usersData: AddUsersData = {
    emails: [],
    isAdmin: undefined,
    message: undefined,
  },
  getToken: () => Promise<string | undefined>,
  config?: ActionConfig
): Promise<Response> {
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
  const token = await getToken();
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

  return new Promise((resolve, reject) => {
    return fetch(`${baseUrl}/user/invite`, requestOpts)
      .then(
        (response) => handleResponse(response, resolve, reject),
        (error) => handleError(error, reject)
      )
      .catch((error) => handleError(error, reject));
  });
}

export type UpdateUserOrgAdmin = {
  id: string;
  is_org_admin: boolean;
};

export async function updateUserIsOrgAdminStatus(
  user: UpdateUserOrgAdmin,
  getToken: () => Promise<string | undefined>,
  config?: ActionConfig
): Promise<Response | any> {
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
  const token = await getToken();
  const requestOpts = {
    method: 'PUT',
    headers: getHeaders(token),
  };

  const url = await fetchBaseUrl();
  const baseUrl = getBaseUrl(url);

  return new Promise((resolve, reject) => {
    return fetch(`${baseUrl}/user/${user.id}/admin/${user.is_org_admin}`, requestOpts)
      .then(
        (response) => handleResponse(response, resolve, reject),
        (error) => handleError(error, reject)
      )
      .catch((error) => handleError(error, reject));
  });
}

export type UpdateUserStatus = {
  id: string;
  is_active: boolean;
};

export async function changeUsersStatus(
  users: UpdateUserStatus[],
  getToken: () => Promise<string | undefined>,
  config: ActionConfig
): Promise<Response[] | any> {
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
  const token = await getToken();
  const requestOpts = {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify({ users: users }),
  };

  const url = await fetchBaseUrl();
  const baseUrl = getBaseUrl(url);

  return new Promise((resolve, reject) => {
    return fetch(`${baseUrl}/change-users-status`, requestOpts)
      .then(
        (response) => handleResponse(response, resolve, reject),
        (error) => handleError(error, reject)
      )
      .catch((error) => handleError(error, reject));
  });
}

export interface FetchUsersParams {
  limit: number;
  offset?: number;
  orderBy?: string;
  filters?: UserFilters;
  usesMetaInURL?: boolean;
  matchCriteria?: 'partial' | 'exact';
}

export async function fetchUsers({
  limit,
  offset = 0,
  orderBy,
  filters = {},
  usesMetaInURL,
  matchCriteria = 'partial',
}: FetchUsersParams): Promise<FetchResponse> {
  const { username, email, status = [] } = filters;
  const sortOrder = orderBy === '-username' ? 'desc' : 'asc';
  const principalStatusApiMap = {
    All: 'all' as const,
    Active: 'enabled' as const,
    Inactive: 'disabled' as const,
  };

  const mappedStatus =
    status.length === 2
      ? principalStatusApiMap.All
      : principalStatusApiMap[status[0] as keyof typeof principalStatusApiMap] ?? principalStatusApiMap.All;

  const response = await principalApi.listPrincipals({
    limit,
    offset,
    matchCriteria,
    usernames: username,
    sortOrder,
    email,
    status: mappedStatus,
  });
  const isPaginationValid = isOffsetValid(offset, response?.data.meta?.count);
  offset = isPaginationValid ? offset : getLastPageOffset(response.data?.meta?.count ?? 0, limit);
  const {
    data: { meta, data },
  } = isPaginationValid
    ? response
    : await principalApi.listPrincipals({
        limit,
        offset,
        matchCriteria,
        usernames: username,
        sortOrder,
        email,
        status: mappedStatus,
      });
  const users = data as Principal[];
  if (usesMetaInURL) {
    return {
      data: users,
      // TODO
      // filters,
      // pagination: {
      //   ...meta,
      //   offset,
      //   limit,
      //   redirected: !isPaginationValid,
      // },
    };
  }
  return {
    data: users,
  };
}
