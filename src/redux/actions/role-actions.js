import * as ActionTypes from '../action-types';
import * as RoleHelper from '../../helpers/role/role-helper';

export const fetchRoles = (options = {}) => ({
  type: ActionTypes.FETCH_ROLES,
  payload: RoleHelper.fetchRoles(options)
});

export const fetchRole = apiProps => ({
  type: ActionTypes.FETCH_ROLE,
  payload: RoleHelper.fetchRole(apiProps)
});

