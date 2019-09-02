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
