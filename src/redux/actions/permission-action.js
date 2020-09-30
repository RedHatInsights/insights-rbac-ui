import * as ActionTypes from '../action-types';
import * as PermissionsHelper from '../../helpers/permission/permission-helper';

export const listPermissions = ({ limit, offset, orderBy, application, resourceType, verb, permission, options }) => ({
  type: ActionTypes.LIST_PERMISSIONS,
  payload: PermissionsHelper.listPermissions(limit, offset, orderBy, application, resourceType, verb, permission, options),
});

const fieldToAction = {
  application: ActionTypes.LIST_APPLICATION_OPTIONS,
  resource_type: ActionTypes.LIST_RESOURCE_OPTIONS,
  verb: ActionTypes.LIST_OPERATION_OPTIONS,
};

export const listPermissionOptions = ({ field, limit, offset, application, resourceType, verb, options }) => ({
  type: fieldToAction[field],
  payload: PermissionsHelper.listPermissionOptions(field, limit, offset, application, resourceType, verb, options),
});
