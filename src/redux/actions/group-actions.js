import * as ActionTypes from '../action-types';
import * as GroupHelper from '../../helpers/group/group-helper';

export const fetchGroups = (options = {}) => ({
  type: ActionTypes.FETCH_GROUPS,
  payload: GroupHelper.fetchGroups(options)
});

export const fetchGroup = apiProps => ({
  type: ActionTypes.FETCH_GROUP,
  payload: GroupHelper.fetchGroup(apiProps)
});

export const addGroup = (groupData) => ({
  type: ActionTypes.ADD_GROUP,
  payload: GroupHelper.addGroup(groupData),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success adding group',
        description: 'The group was added successfully.'
      },
      rejected: {
        variant: 'danger',
        title: 'Failed adding group',
        description: 'The group was not added successfuly.'
      }
    }
  }
});

export const updateGroup = (groupData) => ({
  type: ActionTypes.UPDATE_GROUP,
  payload: GroupHelper.updateGroup(groupData),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success updating group',
        description: 'The group was updated successfully.'
      },
      rejected: {
        variant: 'danger',
        title: 'Failed updating group',
        description: 'The group was not updated successfuly.'
      }
    }
  }
});

export const removeGroup = (group) => ({
  type: ActionTypes.REMOVE_GROUP,
  payload: GroupHelper.removeGroup(group),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success removing group',
        description: 'The group was removed successfully.'
      }
    }
  }
});

export const resetSelectedGroup = () => ({
  type: ActionTypes.RESET_SELECTED_GROUP
});

export const addMembersToGroup = (groupId, members) => ({
  type: ActionTypes.ADD_MEMBERS_TO_GROUP,
  payload: GroupHelper.addPrincipalsToGroup(groupId, members),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success adding members to group',
        description: 'The members were successfully added to the group.'
      },
      rejected: {
        variant: 'danger',
        title: 'Failed adding members to group',
        description: 'The members were not added successfully.'
      }
    }
  }
});

export const removeMembersFromGroup = (groupId, members) => ({
  type: ActionTypes.REMOVE_MEMBERS_FROM_GROUP,
  payload: GroupHelper.deletePrincipalsFromGroup(groupId, members),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success removing members from group',
        description: 'The members were successfully removed from the group.'
      },
      rejected: {
        variant: 'danger',
        title: 'Failed removing members to group',
        description: 'The members were not removed successfully.'
      }
    }
  }
});
