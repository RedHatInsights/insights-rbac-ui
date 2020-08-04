import { getPermissionApi } from '../shared/user-login';

const accessApi = getPermissionApi();

// listPermissions: function (limit, offset, orderBy, application, resourceType, verb, permission, options) {
export async function listPermissions(limit, offset, orderBy, application, resourceType, verb, permission, options) {
    return await accessApi.listPermissions(limit, offset, orderBy, application, resourceType, verb, permission, options);
}
