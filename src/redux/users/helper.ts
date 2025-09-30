import { defaultSettings, getLastPageOffset, isOffsetValid } from '../../helpers/pagination';
import { getPrincipalApi } from '../../api/httpClient';
import { isITLessProd, isInt, isStage } from '../../itLessConfig';
import { User, UserFilters } from './reducer';
import { PaginationDefaultI } from '../../helpers/pagination';

export const MANAGE_SUBSCRIPTIONS_VIEW_EDIT_USER = 'view-edit-user';
export const MANAGE_SUBSCRIPTIONS_VIEW_ALL = 'view-all';
export const MANAGE_SUBSCRIPTIONS_VIEW_EDIT_ALL = 'view-edit-all';

// Portal subscription permission levels
type PortalSubscriptionPermission =
  | typeof MANAGE_SUBSCRIPTIONS_VIEW_EDIT_USER
  | typeof MANAGE_SUBSCRIPTIONS_VIEW_ALL
  | typeof MANAGE_SUBSCRIPTIONS_VIEW_EDIT_ALL;

// Config interface for external API calls
interface Config {
  isProd: boolean;
  token: string | null; // Allow null since components might pass null
  accountId?: string | number | null; // Handle both string and number since it could come from different sources
}

interface EnvConfig {
  int: string;
  stage: string;
  prod: string;
}

interface AddUsersData {
  emails: string[];
  isAdmin?: boolean; // Changed from isOrgAdmin to match component usage
  message?: string;
  portal_manage_cases?: boolean; // Portal permissions
  portal_download?: boolean;
  portal_manage_subscriptions?: PortalSubscriptionPermission; // Use proper type instead of boolean
}

interface UserOrgAdminUpdate {
  id: string;
  is_org_admin: boolean;
}

interface FetchUsersParams {
  limit?: number; // Made optional to match FetchUsersApiProps
  offset?: number;
  orderBy?: string;
  filters?: UserFilters;
  usesMetaInURL?: boolean;
  matchCriteria?: 'partial' | 'exact';
}

interface FetchUsersResponse {
  data: User[];
  meta: PaginationDefaultI & { count: number; offset: number; limit: number };
  filters?: UserFilters;
  pagination?: PaginationDefaultI & { redirected: boolean };
}

const getITApiUrl = (isProd: boolean): string => `https://api.access${isProd ? '' : '.stage'}.redhat.com`;

const principalApi = getPrincipalApi();

const principalStatusApiMap: Record<string, string> = {
  Active: 'enabled',
  Inactive: 'disabled',
  All: 'all',
};

const getBaseUrl = (url: EnvConfig): string => {
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

async function fetchBaseUrl(): Promise<EnvConfig | undefined> {
  try {
    // TODO move to env var defined in cluster surfaced through chrome service
    const response = await fetch('/apps/rbac/env.json');
    const jsonData = (await response.json()) as EnvConfig;
    return jsonData;
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

const getHeaders = (token: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${token}`,
});

function handleResponse(response: Response, resolve: (value: Response) => void, reject: (reason: unknown) => void): void {
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

function handleError(error: Error, reject: (reason: Error) => void): void {
  reject(new Error(error.message));
}

export async function addUsers(
  usersData: AddUsersData = { emails: [], isAdmin: undefined, message: undefined },
  config?: Config,
  itless?: boolean,
): Promise<Response> {
  if (config && config.accountId && config.token && !itless) {
    const currURL = `${getITApiUrl(config.isProd)}/account/v1/accounts/${String(config.accountId)}/users/invite`;
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

  const token = (await (window as any).insights.chrome.auth.getToken()) as string;
  const requestOpts: RequestInit = {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      emails: usersData.emails,
      isAdmin: usersData.isAdmin,
    }),
  };

  const url = await fetchBaseUrl();
  const baseUrl = getBaseUrl(url!);

  const promise = new Promise<Response>((resolve, reject) => {
    return fetch(`${baseUrl}/user/invite`, requestOpts)
      .then(
        (response) => handleResponse(response, resolve, reject),
        (error) => handleError(error, reject),
      )
      .catch((error) => handleError(error, reject));
  });

  return promise;
}

export async function updateUserIsOrgAdminStatus(user: UserOrgAdminUpdate, config?: Config, itless?: boolean): Promise<Response | Response[]> {
  if (config && config.accountId && config.token && !itless) {
    const currURL = `${getITApiUrl(config.isProd)}/account/v1/accounts/${String(config.accountId)}/users/${user.id}/roles`;
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

  const token = (await (window as any).insights.chrome.auth.getToken()) as string;
  const requestOpts: RequestInit = {
    method: 'PUT',
    headers: getHeaders(token),
  };

  const url = await fetchBaseUrl();
  const baseUrl = getBaseUrl(url!);

  const promise = new Promise<Response>((resolve, reject) => {
    return fetch(`${baseUrl}/user/${user.id}/admin/${user.is_org_admin}`, requestOpts)
      .then(
        (response) => handleResponse(response, resolve, reject),
        (error) => handleError(error, reject),
      )
      .catch((error) => handleError(error, reject));
  });

  return promise;
}

export async function changeUsersStatus(users: User[], config?: Config, itless?: boolean): Promise<Response | Response[]> {
  if (config && config.accountId && config.token && !itless) {
    return Promise.all(
      users.map((user) => {
        const currURL = `${getITApiUrl(config.isProd)}/account/v1/accounts/${String(config.accountId)}/users/${user.id}/status`;
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
      }),
    );
  }

  const token = (await (window as any).insights.chrome.auth.getToken()) as string;
  const requestOpts: RequestInit = {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify({ users: users }),
  };

  const url = await fetchBaseUrl();
  const baseUrl = getBaseUrl(url!);

  const promise = new Promise<Response>((resolve, reject) => {
    return fetch(`${baseUrl}/change-users-status`, requestOpts)
      .then(
        (response) => handleResponse(response, resolve, reject),
        (error) => handleError(error, reject),
      )
      .catch((error) => handleError(error, reject));
  });

  return promise;
}

export async function fetchUsers({
  limit, // Remove = defaultSettings.limit default
  offset = 0,
  orderBy,
  filters = {},
  usesMetaInURL,
  matchCriteria = 'partial',
}: FetchUsersParams): Promise<FetchUsersResponse> {
  try {
    const { username, email, status = [] } = filters;
    const sortOrder = orderBy === '-username' ? 'desc' : 'asc';
    const mappedStatus =
      typeof status === 'string'
        ? principalStatusApiMap[status]
        : status.length === 2
          ? principalStatusApiMap.All
          : principalStatusApiMap[status[0]] || principalStatusApiMap.All;

    // Call API with proper parameters - using type assertion to bypass broken rbac-client types
    // NOTE: @redhat-cloud-services/rbac-client has completely broken TypeScript types
    // - API expects undefined for optional parameters, not explicit defaults
    // - Response structure types are inconsistent and cause compilation errors
    // - Using (apiMethod as any) to bypass the broken type definitions
    const response = await (principalApi.listPrincipals as any)(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);
    const isPaginationValid = isOffsetValid(offset, response?.meta?.count);
    const validLimit = limit || defaultSettings.limit;
    offset = isPaginationValid ? offset : getLastPageOffset(response?.meta?.count || 0, validLimit);

    const { data, meta } = isPaginationValid
      ? response
      : await (principalApi.listPrincipals as any)(limit, offset, matchCriteria, username, sortOrder, email, mappedStatus);

    return {
      data,
      meta: {
        ...meta,
        offset,
        limit: validLimit,
      },
      ...(usesMetaInURL
        ? {
            filters,
            pagination: {
              ...meta,
              offset,
              limit: validLimit,
              redirected: !isPaginationValid,
            },
          }
        : {}),
    };
  } catch (error) {
    // Re-throw the error so redux-promise-middleware can handle it
    throw error;
  }
}
