import {
  ADD_GROUP,
  ADD_MEMBERS_TO_GROUP,
  ADD_ROLES_TO_GROUP,
  ADD_SERVICE_ACCOUNTS_TO_GROUP,
  FETCH_ADD_ROLES_FOR_GROUP,
  FETCH_ADMIN_GROUP,
  FETCH_GROUP,
  FETCH_GROUPS,
  FETCH_MEMBERS_FOR_EXPANDED_GROUP,
  FETCH_MEMBERS_FOR_GROUP,
  FETCH_ROLES_FOR_EXPANDED_GROUP,
  FETCH_ROLES_FOR_GROUP,
  FETCH_SERVICE_ACCOUNTS_FOR_GROUP,
  FETCH_SYSTEM_GROUP,
  INVALIDATE_SYSTEM_GROUP,
  REMOVE_GROUPS,
  REMOVE_MEMBERS_FROM_GROUP,
  REMOVE_ROLES_FROM_GROUP,
  REMOVE_SERVICE_ACCOUNTS_FROM_GROUP,
  RESET_SELECTED_GROUP,
  UPDATE_GROUP,
  UPDATE_GROUPS_FILTERS,
} from './action-types';
import {
  FetchAccountsForGroupParams,
  FetchGroupsParams,
  FetchMembersForGroupParams,
  FetchRolesForGroupParams,
  addGroup as addGroupHelper,
  addMembersToGroup as addMembersToGroupHelper,
  addRolesToGroup as addRolesToGroupHelper,
  addServiceAccountsToGroup as addServiceAccountsToGroupHelper,
  deleteMembersFromGroup as deleteMembersFromGroupHelper,
  deleteRolesFromGroup as deleteRolesFromGroupHelper,
  fetchAccountsForGroup as fetchAccountsForGroupHelper,
  fetchGroup as fetchGroupHelper,
  fetchGroups as fetchGroupsHelper,
  fetchMembersForGroup as fetchMembersForGroupHelper,
  fetchRolesForGroup as fetchRolesForGroupHelper,
  removeGroups as removeGroupsHelper,
  removeServiceAccountsFromGroup as removeServiceAccountsFromGroupHelper,
  updateGroup as updateGroupHelper,
} from './helper';
import { createIntl, createIntlCache } from 'react-intl';
import { BAD_UUID } from '../../helpers/dataUtilities';
import messages from '../../Messages';
import providerMessages from '../../locales/data.json';
import { locale } from '../../locales/locale';
import { Group, PrincipalIn } from '@redhat-cloud-services/rbac-client/types';

interface ErrorResponse {
  errors?: Array<{
    detail?: string;
    status?: string;
    source?: string;
  }>;
}

interface FetchGroupOptionsParams {
  filterValue?: string;
  chrome?: { auth?: { getUser?: () => Promise<any> } };
}

interface RolesFetchOptions {
  isPlatformDefault?: boolean;
  isAdminDefault?: boolean;
}

const handleUuidError = (err: any) => {
  // Handle 404 errors (non-existent group with valid UUID)
  if (err?.status === 404 || err?.response?.status === 404) {
    return { error: BAD_UUID };
  }

  // Handle 400 errors from axios (malformed UUID)
  if (err?.response?.status === 400) {
    const errorData = err.response.data;
    const error = errorData?.errors?.[0] || {};
    if (error.status === '400' && error.source === 'group uuid validation') {
      return { error: BAD_UUID };
    }
  }

  // Handle 400 errors from direct ErrorResponse format (malformed UUID)
  const error = err?.errors?.[0] || {};
  if (error.status === '400' && error.source === 'group uuid validation') {
    return { error: BAD_UUID };
  }

  throw err;
};

export const fetchGroups = (options: FetchGroupsParams = {}): ReduxAction<Promise<unknown>> => ({
  type: FETCH_GROUPS,
  payload: fetchGroupsHelper(options),
});

export const fetchAdminGroup = ({ filterValue, chrome }: FetchGroupOptionsParams = {}): ReduxAction<Promise<unknown>> => ({
  type: FETCH_ADMIN_GROUP,
  payload: fetchGroupsHelper({
    limit: 1,
    ...(filterValue?.length && filterValue.length > 0 ? { filters: { name: filterValue }, nameMatch: 'partial' } : {}),
    adminDefault: true,
    chrome,
  }),
});

export const fetchSystemGroup = ({ filterValue, chrome }: FetchGroupOptionsParams = {}): ReduxAction<Promise<unknown>> => ({
  type: FETCH_SYSTEM_GROUP,
  payload: fetchGroupsHelper({
    limit: 1,
    ...(filterValue?.length && filterValue.length > 0 ? { filters: { name: filterValue }, nameMatch: 'partial' } : {}),
    platformDefault: true,
    chrome,
  }),
});

export const invalidateSystemGroup = () => ({
  type: INVALIDATE_SYSTEM_GROUP,
  payload: undefined,
});

export const fetchGroup = (apiProps: string): ReduxAction<Promise<unknown>> => ({
  type: FETCH_GROUP,
  payload: fetchGroupHelper(apiProps).catch(handleUuidError),
});

export const addGroup = (
  groupData: Group & {
    user_list?: PrincipalIn[];
    roles_list?: string[];
  },
): ReduxAction<Promise<unknown>> => ({
  type: ADD_GROUP,
  payload: addGroupHelper(groupData).catch((err: ErrorResponse) => {
    const error = err?.errors?.[0] || {};
    if (error.status === '400' && error.source === 'name') {
      return {
        error: true,
      };
    }

    /**
     * Convert any other API error response to not crash notifications.
     * It has different format than other API requests.
     */
    throw {
      message: error.detail,
      description: error.source,
    };
  }),
});

export const updateGroup = (groupData: Group & { uuid: string }): ReduxAction<Promise<unknown>> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: UPDATE_GROUP,
    payload: updateGroupHelper(groupData),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.editGroupSuccessTitle),
          dismissable: true,
          description: intl.formatMessage(messages.editGroupSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.editGroupErrorTitle),
          dismissable: true,
          description: intl.formatMessage(messages.editGroupErrorDescription),
        },
      },
    },
  };
};

export const removeGroups = (uuids: string[]): ReduxAction<Promise<unknown>> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: REMOVE_GROUPS,
    payload: removeGroupsHelper(uuids),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(uuids.length > 1 ? messages.removeGroupsSuccess : messages.removeGroupSuccess),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(uuids.length > 1 ? messages.removeGroupsError : messages.removeGroupError),
        },
      },
    },
  };
};

export const resetSelectedGroup = () => ({
  type: RESET_SELECTED_GROUP,
  payload: undefined,
});

export const addMembersToGroup = (groupId: string, members: PrincipalIn[]): ReduxAction<Promise<unknown>> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  const singleMember = members.length > 1;
  return {
    type: ADD_MEMBERS_TO_GROUP,
    payload: addMembersToGroupHelper(groupId, members),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(singleMember ? messages.addGroupMembersSuccessTitle : messages.addGroupMemberSuccessTitle),
          description: intl.formatMessage(singleMember ? messages.addGroupMembersSuccessDescription : messages.addGroupMemberSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(singleMember ? messages.addGroupMemberErrorTitle : messages.addGroupMembersErrorTitle),
          description: intl.formatMessage(singleMember ? messages.addGroupMemberErrorDescription : messages.addGroupMembersErrorDescription),
        },
      },
    },
  };
};

export const removeMembersFromGroup = (groupId: string, members: string[]): ReduxAction<Promise<unknown>> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: REMOVE_MEMBERS_FROM_GROUP,
    payload: deleteMembersFromGroupHelper(groupId, members),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.removeGroupMembersSuccessTitle),
          description: intl.formatMessage(messages.removeGroupMembersSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.removeGroupMembersErrorTitle),
          description: intl.formatMessage(messages.removeGroupMembersErrorDescription),
        },
      },
    },
  };
};

export const fetchRolesForGroup = (groupId: string, pagination: FetchRolesForGroupParams): ReduxAction<Promise<unknown>> => ({
  type: FETCH_ROLES_FOR_GROUP,
  payload: fetchRolesForGroupHelper(groupId, false, pagination).catch(handleUuidError),
});

export const fetchRolesForExpandedGroup = (
  groupId: string,
  pagination: FetchRolesForGroupParams,
  options: RolesFetchOptions = {},
): ReduxAction<Promise<unknown>> => ({
  type: FETCH_ROLES_FOR_EXPANDED_GROUP,
  payload: fetchRolesForGroupHelper(groupId, false, pagination).catch(handleUuidError),
  meta: {
    notifications: undefined,
    groupId,
    isPlatformDefault: options.isPlatformDefault,
    isAdminDefault: options.isAdminDefault,
  } as ActionMeta & { groupId: string; isPlatformDefault?: boolean; isAdminDefault?: boolean },
});

export const fetchMembersForGroup = (
  groupId: string,
  usernames?: string,
  options: FetchMembersForGroupParams = {},
): ReduxAction<Promise<unknown>> => ({
  type: FETCH_MEMBERS_FOR_GROUP,
  payload: fetchMembersForGroupHelper(groupId, usernames, options).catch(handleUuidError),
});

export const fetchMembersForExpandedGroup = (
  groupId: string,
  usernames?: string,
  options: FetchMembersForGroupParams = {},
): ReduxAction<Promise<unknown>> => ({
  type: FETCH_MEMBERS_FOR_EXPANDED_GROUP,
  payload: fetchMembersForGroupHelper(groupId, usernames, options).catch(handleUuidError),
  meta: {
    notifications: undefined,
    groupId,
  } as ActionMeta & { groupId: string },
});

export const fetchServiceAccountsForGroup = (groupId: string, options: FetchAccountsForGroupParams = {}): ReduxAction<Promise<unknown>> => ({
  type: FETCH_SERVICE_ACCOUNTS_FOR_GROUP,
  payload: fetchAccountsForGroupHelper(groupId, options).catch(handleUuidError),
});

export const addServiceAccountsToGroup = (groupId: string, serviceAccounts: Array<{ uuid: string }>): ReduxAction<Promise<unknown>> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: ADD_SERVICE_ACCOUNTS_TO_GROUP,
    payload: addServiceAccountsToGroupHelper(groupId, serviceAccounts),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.addGroupServiceAccountsSuccessTitle, { count: serviceAccounts.length }),
          description: intl.formatMessage(messages.addGroupServiceAccountsSuccessDescription, {
            count: serviceAccounts.length,
          }),
        },
        rejected: (payload: ErrorResponse) => ({
          variant: 'danger',
          title: intl.formatMessage(messages.addGroupServiceAccountsErrorTitle, { count: serviceAccounts.length }),
          description: intl.formatMessage(
            Number(payload?.errors?.[0]?.status) === 404 ? messages.groupDoesNotExist : messages.addGroupServiceAccountsErrorDescription,
            { count: serviceAccounts.length, id: groupId },
          ),
        }),
      },
    },
  };
};

export const removeServiceAccountFromGroup = (groupId: string, serviceAccountsIds: string[]): ReduxAction<Promise<unknown>> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: REMOVE_SERVICE_ACCOUNTS_FROM_GROUP,
    payload: removeServiceAccountsFromGroupHelper(groupId, serviceAccountsIds),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.removeGroupServiceAccountsSuccessTitle, {
            count: serviceAccountsIds.length,
          }),
          description: intl.formatMessage(messages.removeGroupServiceAccountsSuccessDescription, {
            count: serviceAccountsIds.length,
          }),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.removeGroupServiceAccountsErrorTitle, { count: serviceAccountsIds.length }),
          description: intl.formatMessage(messages.removeGroupServiceAccountsErrorDescription, {
            count: serviceAccountsIds.length,
          }),
        },
      },
    },
  };
};

export const fetchAddRolesForGroup = (groupId: string, pagination: FetchRolesForGroupParams): ReduxAction<Promise<unknown>> => ({
  type: FETCH_ADD_ROLES_FOR_GROUP,
  payload: fetchRolesForGroupHelper(groupId, true, pagination).catch(handleUuidError),
});

export const addRolesToGroup = (groupId: string, roles: string[]): ReduxAction<Promise<unknown>> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: ADD_ROLES_TO_GROUP,
    payload: addRolesToGroupHelper(groupId, roles),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.addGroupRolesSuccessTitle),
          description: intl.formatMessage(messages.addGroupRolesSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.addGroupRolesErrorTitle),
          description: intl.formatMessage(messages.addGroupRolesErrorDescription),
        },
      },
    },
  };
};

export const removeRolesFromGroup = (groupId: string, roles: string[]): ReduxAction<Promise<unknown>> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: REMOVE_ROLES_FROM_GROUP,
    payload: deleteRolesFromGroupHelper(groupId, roles),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.removeGroupRolesSuccessTitle),
          description: intl.formatMessage(messages.removeGroupRolesSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.removeGroupRolesErrorTitle),
          description: intl.formatMessage(messages.removeGroupRolesErrorDescription),
        },
      },
    },
  };
};

export const updateGroupsFilters = (filters: Record<string, unknown>): ReduxAction<Record<string, unknown>> => ({
  type: UPDATE_GROUPS_FILTERS,
  payload: filters,
});
