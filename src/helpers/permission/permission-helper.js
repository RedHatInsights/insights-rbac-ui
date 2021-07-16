import { getPermissionApi } from '../shared/user-login';

const accessApi = getPermissionApi();

export async function listPermissions(limit, offset, orderBy, application, resourceType, verb, permission, options) {
  return await accessApi.listPermissions(limit, offset, orderBy, application, resourceType, verb, permission, options);
}

export async function listPermissionOptions(field, limit, offset, application, resourceType, verb, options) {
  return await accessApi.listPermissionOptions(field, limit, offset, application, resourceType, verb, options);
}
