import * as ActionTypes from '../action-types';
import * as GroupHelper from '../../helpers/group/group-helper';

export const fetchGroups = (options = {}) => ({
  type: ActionTypes.FETCH_GROUPS,
  payload: GroupHelper.fetchGroups(options),
});

export const fetchSystemGroup = (filterValue) => ({
  type: ActionTypes.FETCH_SYSTEM_GROUP,
  payload: GroupHelper.fetchGroups({
    limit: 1,
    name: filterValue || 'default',
    nameMatch: 'partial',
  }),
});

export const fetchGroup = (apiProps) => ({
  type: ActionTypes.FETCH_GROUP,
  payload: GroupHelper.fetchGroup(apiProps),
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

export const updateGroup = (groupData) => ({
  type: ActionTypes.UPDATE_GROUP,
  payload: GroupHelper.updateGroup(groupData),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success updating group',
        dismissDelay: 8000,
        dismissable: false,
        description: 'The group was updated successfully.',
      },
      rejected: {
        variant: 'danger',
        title: 'Failed updating group',
        dismissDelay: 8000,
        dismissable: false,
        description: 'The group was not updated successfuly.',
      },
    },
  },
});

export const removeGroups = (uuids) => ({
  type: ActionTypes.REMOVE_GROUPS,
  payload: GroupHelper.removeGroups(uuids),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        dismissDelay: 8000,
        dismissable: false,
        title: uuids.length > 1 ? 'Groups deleted successfully' : 'Group deleted successfully',
      },
      rejected: {
        variant: 'danger',
        dismissDelay: 8000,
        dismissable: false,
        title:
          uuids.length > 1 ? 'There was an error deleting the groups. Please try again.' : 'There was an error deleting the group. Please try again.',
      },
    },
  },
});

export const resetSelectedGroup = () => ({
  type: ActionTypes.RESET_SELECTED_GROUP,
});

export const addMembersToGroup = (groupId, members) => ({
  type: ActionTypes.ADD_MEMBERS_TO_GROUP,
  payload: GroupHelper.addPrincipalsToGroup(groupId, members),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success adding members to group',
        dismissDelay: 8000,
        dismissable: false,
        description: 'The members were successfully added to the group.',
      },
      rejected: {
        variant: 'danger',
        title: 'Failed adding members to group',
        dismissDelay: 8000,
        dismissable: false,
        description: 'The members were not added successfully.',
      },
    },
  },
});

export const removeMembersFromGroup = (groupId, members) => ({
  type: ActionTypes.REMOVE_MEMBERS_FROM_GROUP,
  payload: GroupHelper.deletePrincipalsFromGroup(groupId, members),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success removing members from group',
        dismissDelay: 8000,
        dismissable: false,
        description: 'The members were successfully removed from the group.',
      },
      rejected: {
        variant: 'danger',
        title: 'Failed removing members from group',
        dismissDelay: 8000,
        dismissable: false,
        description: 'The members were not removed successfully.',
      },
    },
  },
});

export const fetchRolesForGroup = (groupId, pagination, options) => ({
  type: ActionTypes.FETCH_ROLES_FOR_GROUP,
  payload: GroupHelper.fetchRolesForGroup(groupId, false, pagination, options),
});

export const fetchMembersForGroup = (groupId, usernames, options) => ({
  type: ActionTypes.FETCH_MEMBERS_FOR_GROUP,
  payload: GroupHelper.fetchPrincipalsForGroup(groupId, usernames, options),
});

export const fetchAddRolesForGroup = (groupId, pagination, options) => ({
  type: ActionTypes.FETCH_ADD_ROLES_FOR_GROUP,
  payload: GroupHelper.fetchRolesForGroup(groupId, true, pagination, options),
});

export const addRolesToGroup = (groupId, roles) => ({
  type: ActionTypes.ADD_ROLES_TO_GROUP,
  payload: GroupHelper.addRolesToGroup(groupId, roles),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success adding roles to group',
        dismissDelay: 8000,
        dismissable: false,
        description: 'The roles were successfully added to the group.',
      },
      rejected: {
        variant: 'danger',
        title: 'Failed adding roles to group',
        dismissDelay: 8000,
        dismissable: false,
        description: 'The roles were not added successfully.',
      },
    },
  },
});

export const removeRolesFromGroup = (groupId, roles) => ({
  type: ActionTypes.REMOVE_ROLES_FROM_GROUP,
  payload: GroupHelper.deleteRolesFromGroup(groupId, roles),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success removing roles from group',
        dismissDelay: 8000,
        dismissable: false,
        description: 'The roles were successfully removed from the group.',
      },
      rejected: {
        variant: 'danger',
        title: 'Failed removing roles from group',
        dismissDelay: 8000,
        dismissable: false,
        description: 'The roles were not removed successfully.',
      },
    },
  },
});
