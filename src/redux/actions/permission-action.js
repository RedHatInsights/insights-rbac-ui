import * as ActionTypes from '../action-types';
import * as PermissionsHelper from '../../helpers/permission/permission-helper';

export const listPermissions = ({ limit, offset, orderBy, application, resourceType, verb, permission, options }) => ({
    type: ActionTypes.LIST_PERMISSIONS,
    payload: PermissionsHelper.listPermissions(limit, offset, orderBy, application, resourceType, verb, permission, options)
});
