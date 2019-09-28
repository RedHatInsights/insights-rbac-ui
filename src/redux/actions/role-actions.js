import * as ActionTypes from '../action-types';
import * as RoleHelper from '../../helpers/role/role-helper';

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

export const resetSelectedRole = () => ({
  type: ActionTypes.RESET_SELECTED_ROLE
});
