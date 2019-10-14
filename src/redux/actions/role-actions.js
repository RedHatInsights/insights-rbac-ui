import * as ActionTypes from '../action-types';
import * as RoleHelper from '../../helpers/role/role-helper';

export const createRole = (roleData) => ({
  type: ActionTypes.ADD_ROLE,
  payload: RoleHelper.createRole(roleData),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success adding role',
        description: 'The role was added successfully.'
      },
      rejected: {
        variant: 'danger',
        title: 'Failed adding role',
        description: 'The role was not added successfuly.'
      }
    }
  }
});

export const fetchRole = apiProps => ({
  type: ActionTypes.FETCH_ROLE,
  payload: RoleHelper.fetchRole(apiProps)
});

export const fetchRoles = (options = {}) => ({
  type: ActionTypes.FETCH_ROLES,
  payload: RoleHelper.fetchRoles(options)
});

export const fetchRolesWithPolicies = (options = {}) => ({
  type: ActionTypes.FETCH_ROLES,
  payload: RoleHelper.fetchRolesWithPolicies(options)
});

export const removeRole = (role) => ({
  type: ActionTypes.REMOVE_ROLE,
  payload: RoleHelper.removeRole(role),
  meta: {
    notifications: {
      fulfilled: {
        variant: 'success',
        title: 'Success removing role',
        description: 'The role was removed successfully.'
      }
    }
  }
});

