import * as ActionTypes from '../action-types';
import * as PermissionsHelper from '../../helpers/permission/permission-helper';

export const listPermissions = ({
  limit,
  offset,
  orderBy,
  application,
  resourceType,
  verb,
  permission,
  exclude_globals = true,
  exclude_roles,
  allowed_only,
  options,
}) => ({
  type: ActionTypes.LIST_PERMISSIONS,
  payload: PermissionsHelper.listPermissions(
    limit,
    offset,
    orderBy,
    application,
    resourceType,
    verb,
    permission,
    exclude_globals,
    exclude_roles,
    allowed_only,
    options,
  ),
});

const fieldToAction = {
  application: ActionTypes.LIST_APPLICATION_OPTIONS,
  resource_type: ActionTypes.LIST_RESOURCE_OPTIONS,
  verb: ActionTypes.LIST_OPERATION_OPTIONS,
};

export const listPermissionOptions = ({ field, limit, offset, application, resourceType, verb, allowedOnly, options }) => ({
  type: fieldToAction[field],
  payload: PermissionsHelper.listPermissionOptions(field, limit, offset, application, resourceType, verb, allowedOnly, options),
});

export const expandSplats = ({
  limit = 1000,
  offset = 0,
  orderBy,
  application,
  resourceType,
  verb,
  permission,
  exclude_globals = true,
  options,
}) => ({
  type: ActionTypes.EXPAND_SPLATS,
  payload: PermissionsHelper.listPermissions(limit, offset, orderBy, application, resourceType, verb, permission, exclude_globals, options),
});

export const resetExpandSplats = () => ({
  type: ActionTypes.RESET_EXPAND_SPLATS,
  payload: {
    data: [],
  },
});
