import * as ActionTypes from '../action-types';
import * as GroupHelper from '../../helpers/group/group-helper';
import { createIntl, createIntlCache } from 'react-intl';
import { BAD_UUID } from '../../helpers/shared/helpers';
import messages from '../../Messages';
import providerMessages from '../../locales/data.json';

import { locale } from '../../locales/locale';

const handleUuidError = (err) => {
  const error = err?.errors?.[0] || {};
  if (error.status === '400' && error.source === 'group uuid validation') {
    return { error: BAD_UUID };
  }

  throw err;
};

export const fetchGroups = (options = {}) => ({
  type: ActionTypes.FETCH_GROUPS,
  payload: GroupHelper.fetchGroups(options),
});

export const fetchAdminGroup = ({ filterValue, chrome } = {}) => ({
  type: ActionTypes.FETCH_ADMIN_GROUP,
  payload: GroupHelper.fetchGroups({
    limit: 1,
    ...(filterValue?.length > 0 ? { filters: { name: filterValue }, nameMatch: 'partial' } : {}),
    adminDefault: true,
    chrome,
  }),
});

export const fetchSystemGroup = ({ filterValue, chrome } = {}) => ({
  type: ActionTypes.FETCH_SYSTEM_GROUP,
  payload: GroupHelper.fetchGroups({
    limit: 1,
    ...(filterValue?.length > 0 ? { filters: { name: filterValue }, nameMatch: 'partial' } : {}),
    platformDefault: true,
    chrome,
  }),
});

export const invalidateSystemGroup = () => ({
  type: ActionTypes.INVALIDATE_SYSTEM_GROUP,
});

export const fetchGroup = (apiProps) => ({
  type: ActionTypes.FETCH_GROUP,
  payload: GroupHelper.fetchGroup(apiProps).catch(handleUuidError),
});

export const addGroup = (groupData) => ({
  type: ActionTypes.ADD_GROUP,
  payload: GroupHelper.addGroup(groupData).catch((err) => {
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

export const updateGroup = (groupData) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.UPDATE_GROUP,
    payload: GroupHelper.updateGroup(groupData),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.editGroupSuccessTitle),
          dismissDelay: 8000,
          dismissable: true,
          description: intl.formatMessage(messages.editGroupSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.editGroupErrorTitle),
          dismissDelay: 8000,
          dismissable: true,
          description: intl.formatMessage(messages.editGroupErrorDescription),
        },
      },
    },
  };
};

export const removeGroups = (uuids) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.REMOVE_GROUPS,
    payload: GroupHelper.removeGroups(uuids),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          dismissDelay: 8000,
          title: intl.formatMessage(uuids.length > 1 ? messages.removeGroupsSuccess : messages.removeGroupSuccess),
        },
        rejected: {
          variant: 'danger',
          dismissDelay: 8000,
          title: intl.formatMessage(uuids.length > 1 ? messages.removeGroupsError : messages.removeGroupError),
        },
      },
    },
  };
};

export const resetSelectedGroup = () => ({
  type: ActionTypes.RESET_SELECTED_GROUP,
});

export const addMembersToGroup = (groupId, members) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  const singleMember = members.length > 1;
  return {
    type: ActionTypes.ADD_MEMBERS_TO_GROUP,
    payload: GroupHelper.addMembersToGroup(groupId, members),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(singleMember ? messages.addGroupMembersSuccessTitle : messages.addGroupMemberSuccessTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(singleMember ? messages.addGroupMembersSuccessDescription : messages.addGroupMemberSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(singleMember ? messages.addGroupMemberErrorTitle : messages.addGroupMembersErrorTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(singleMember ? messages.addGroupMemberErrorDescription : messages.addGroupMembersErrorDescription),
        },
      },
    },
  };
};

export const removeMembersFromGroup = (groupId, members) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.REMOVE_MEMBERS_FROM_GROUP,
    payload: GroupHelper.deleteMembersFromGroup(groupId, members),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.removeGroupMembersSuccessTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.removeGroupMembersSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.removeGroupMembersErrorTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.removeGroupMembersErrorDescription),
        },
      },
    },
  };
};

export const fetchRolesForGroup = (groupId, pagination, options) => ({
  type: ActionTypes.FETCH_ROLES_FOR_GROUP,
  payload: GroupHelper.fetchRolesForGroup(groupId, false, pagination, options).catch(handleUuidError),
});

export const fetchRolesForExpandedGroup = (groupId, pagination, options) => ({
  type: ActionTypes.FETCH_ROLES_FOR_EXPANDED_GROUP,
  payload: GroupHelper.fetchRolesForGroup(groupId, false, pagination, options).catch(handleUuidError),
  meta: { groupId, isPlatformDefault: options.isPlatformDefault, isAdminDefault: options.isAdminDefault },
});

export const fetchMembersForGroup = (groupId, usernames, options) => ({
  type: ActionTypes.FETCH_MEMBERS_FOR_GROUP,
  payload: GroupHelper.fetchMembersForGroup(groupId, usernames, options).catch(handleUuidError),
});

export const fetchMembersForExpandedGroup = (groupId, usernames, options) => ({
  type: ActionTypes.FETCH_MEMBERS_FOR_EXPANDED_GROUP,
  payload: GroupHelper.fetchMembersForGroup(groupId, usernames, options).catch(handleUuidError),
  meta: { groupId },
});

export const fetchServiceAccountsForGroup = (groupId, options) => ({
  type: ActionTypes.FETCH_SERVICE_ACCOUNTS_FOR_GROUP,
  payload: GroupHelper.fetchAccountsForGroup(groupId, options).catch(handleUuidError),
});

export const addServiceAccountsToGroup = (groupId, serviceAccounts) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.ADD_SERVICE_ACCOUNTS_TO_GROUP,
    payload: GroupHelper.addServiceAccountsToGroup(groupId, serviceAccounts),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.addGroupServiceAccountsSuccessTitle, { count: serviceAccounts.length }),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.addGroupServiceAccountsSuccessDescription, { count: serviceAccounts.length }),
        },
        rejected: (payload) => ({
          variant: 'danger',
          title: intl.formatMessage(messages.addGroupServiceAccountsErrorTitle, { count: serviceAccounts.length }),
          dismissDelay: 8000,
          description: intl.formatMessage(
            Number(payload?.errors?.[0]?.status) === 404 ? messages.groupDoesNotExist : messages.addGroupServiceAccountsErrorDescription,
            { count: serviceAccounts.length, id: groupId }
          ),
        }),
      },
    },
  };
};

export const removeServiceAccountFromGroup = (groupId, serviceAccountsIds) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.REMOVE_SERVICE_ACCOUNTS_FROM_GROUP,
    payload: GroupHelper.removeServiceAccountsFromGroup(groupId, serviceAccountsIds),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.removeGroupServiceAccountsSuccessTitle, { count: serviceAccountsIds.length }),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.removeGroupServiceAccountsSuccessDescription, { count: serviceAccountsIds.length }),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.removeGroupServiceAccountsErrorTitle, { count: serviceAccountsIds.length }),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.removeGroupServiceAccountsErrorDescription, { count: serviceAccountsIds.length }),
        },
      },
    },
  };
};

export const fetchAddRolesForGroup = (groupId, pagination, options) => ({
  type: ActionTypes.FETCH_ADD_ROLES_FOR_GROUP,
  payload: GroupHelper.fetchRolesForGroup(groupId, true, pagination, options).catch(handleUuidError),
});

export const addRolesToGroup = (groupId, roles) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.ADD_ROLES_TO_GROUP,
    payload: GroupHelper.addRolesToGroup(groupId, roles),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.addGroupRolesSuccessTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.addGroupRolesSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.addGroupRolesErrorTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.addGroupRolesErrorDescription),
        },
      },
    },
  };
};

export const removeRolesFromGroup = (groupId, roles) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.REMOVE_ROLES_FROM_GROUP,
    payload: GroupHelper.deleteRolesFromGroup(groupId, roles),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.removeGroupRolesSuccessTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.removeGroupRolesSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.removeGroupRolesErrorTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.removeGroupRolesErrorDescription),
        },
      },
    },
  };
};

export const updateGroupsFilters = (filters) => ({
  type: ActionTypes.UPDATE_GROUPS_FILTERS,
  payload: filters,
});
