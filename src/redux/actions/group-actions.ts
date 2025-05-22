import { useIntl } from 'react-intl';
import * as GroupHelper from '../../helpers/group/group-helper';
import {
  AddGroup,
  AddServiceAccount,
  FetchAccountsOptions,
  FetchGroupsParams,
  FetchMembersOptions,
  FetchRolesOptions,
  UpdateGroup,
} from '../../helpers/group/group-helper';
import { BAD_UUID } from '../../helpers/shared/helpers';
import messages from '../../Messages';
import * as ActionTypes from '../action-types';

const handleUuidError = (err: { errors: { status: string; source: string }[] }) => {
  const error = err?.errors?.[0] || {};
  if (error.status === '400' && error.source === 'group uuid validation') {
    return { error: BAD_UUID };
  }

  throw err;
};

export const fetchGroups = (options: FetchGroupsParams) => ({
  type: ActionTypes.FETCH_GROUPS,
  payload: GroupHelper.fetchGroups(options),
});

export const fetchAdminGroup = ({
  filterValue,
  chrome,
}: Omit<FetchGroupsParams, 'filters'> & {
  filterValue?: string;
}) => ({
  type: ActionTypes.FETCH_ADMIN_GROUP,
  payload: GroupHelper.fetchGroups({
    limit: 1,
    ...(filterValue && filterValue.length > 0 ? { filters: { name: filterValue }, nameMatch: 'partial' } : {}),
    adminDefault: true,
    chrome,
  }),
});

export const fetchSystemGroup = ({
  filterValue,
  chrome,
}: Omit<FetchGroupsParams, 'filters'> & {
  filterValue?: string;
}) => ({
  type: ActionTypes.FETCH_SYSTEM_GROUP,
  payload: GroupHelper.fetchGroups({
    limit: 1,
    ...(filterValue && filterValue.length > 0 ? { filters: { name: filterValue }, nameMatch: 'partial' } : {}),
    platformDefault: true,
    chrome,
  }),
});

export const invalidateSystemGroup = () => ({
  type: ActionTypes.INVALIDATE_SYSTEM_GROUP,
});

export const fetchGroup = (uuid: string) => ({
  type: ActionTypes.FETCH_GROUP,
  payload: GroupHelper.fetchGroup(uuid).catch(handleUuidError),
});

export const addGroup = (groupData: AddGroup) => ({
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

export function useGroupActions() {
  const intl = useIntl();

  const updateGroup = (groupData: UpdateGroup): ActionWithNotification<ReturnType<typeof GroupHelper.updateGroup>> => {
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

  const removeGroups = (uuids: string[]): ActionWithNotification<ReturnType<typeof GroupHelper.removeGroups>> => {
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

  const resetSelectedGroup = () => ({
    type: ActionTypes.RESET_SELECTED_GROUP,
  });

  const addMembersToGroup = (groupId: string, members: string[]): ActionWithNotification<ReturnType<typeof GroupHelper.addMembersToGroup>> => {
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

  const removeMembersFromGroup = (
    groupId: string,
    members: string[]
  ): ActionWithNotification<ReturnType<typeof GroupHelper.deleteMembersFromGroup>> => {
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

  const addServiceAccountsToGroup = (
    groupId: string,
    serviceAccounts: AddServiceAccount[]
  ): ActionWithNotification<ReturnType<typeof GroupHelper.addServiceAccountsToGroup>> => {
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

  const removeServiceAccountFromGroup = (
    groupId: string,
    serviceAccountsIds: string[]
  ): ActionWithNotification<ReturnType<typeof GroupHelper.removeServiceAccountsFromGroup>> => {
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
  const addRolesToGroup = (groupId: string, roles: string[]): ActionWithNotification<ReturnType<typeof GroupHelper.addRolesToGroup>> => {
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

  const removeRolesFromGroup = (groupId: string, roles: string[]): ActionWithNotification<ReturnType<typeof GroupHelper.deleteRolesFromGroup>> => {
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

  return {
    updateGroup,
    removeGroups,
    resetSelectedGroup,
    addMembersToGroup,
    removeMembersFromGroup,
    addServiceAccountsToGroup,
    removeServiceAccountFromGroup,
    addRolesToGroup,
    removeRolesFromGroup,
  };
}

export const fetchRolesForGroup = (groupId: string, pagination: FetchRolesOptions) => ({
  type: ActionTypes.FETCH_ROLES_FOR_GROUP,
  payload: GroupHelper.fetchRolesForGroup(groupId, false, pagination).catch(handleUuidError),
});

export const fetchRolesForExpandedGroup = (
  groupId: string,
  pagination: FetchRolesOptions,
  options: {
    isPlatformDefault?: boolean;
    isAdminDefault?: boolean;
  } = {}
) => ({
  type: ActionTypes.FETCH_ROLES_FOR_EXPANDED_GROUP,
  payload: GroupHelper.fetchRolesForGroup(groupId, false, pagination).catch(handleUuidError),
  meta: { groupId, isPlatformDefault: options.isPlatformDefault, isAdminDefault: options.isAdminDefault },
});

export const fetchMembersForGroup = (groupId: string, usernames: string, options: FetchMembersOptions) => ({
  type: ActionTypes.FETCH_MEMBERS_FOR_GROUP,
  payload: GroupHelper.fetchMembersForGroup(groupId, usernames, options).catch(handleUuidError),
});

export const fetchMembersForExpandedGroup = (groupId: string, usernames: string, options: FetchMembersOptions) => ({
  type: ActionTypes.FETCH_MEMBERS_FOR_EXPANDED_GROUP,
  payload: GroupHelper.fetchMembersForGroup(groupId, usernames, options).catch(handleUuidError),
  meta: { groupId },
});

export const fetchServiceAccountsForGroup = (groupId: string, options: FetchAccountsOptions) => ({
  type: ActionTypes.FETCH_SERVICE_ACCOUNTS_FOR_GROUP,
  payload: GroupHelper.fetchAccountsForGroup(groupId, options).catch(handleUuidError),
});

export const fetchAddRolesForGroup = (groupId: string, options: FetchRolesOptions) => ({
  type: ActionTypes.FETCH_ADD_ROLES_FOR_GROUP,
  payload: GroupHelper.fetchRolesForGroup(groupId, true, options).catch(handleUuidError),
});

export const updateGroupsFilters = (filters: Record<string, unknown>) => ({
  type: ActionTypes.UPDATE_GROUPS_FILTERS,
  payload: filters,
});
