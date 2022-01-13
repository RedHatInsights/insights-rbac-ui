import { getPermissionApi } from '../shared/user-login';

const accessApi = getPermissionApi();

export async function listPermissions(
  limit,
  offset,
  orderBy,
  application,
  resourceType,
  verb,
  permission,
  excludeGlobals,
  excludeRoles,
  allowedOnly,
  options
) {
  return await accessApi.listPermissions(
    limit,
    offset,
    orderBy,
    application,
    resourceType,
    verb,
    permission,
    excludeGlobals,
    excludeRoles,
    allowedOnly,
    options
  );
}

export async function listPermissionOptions(field, limit, offset, application, resourceType, verb, allowedOnly, options) {
  return await accessApi.listPermissionOptions(field, limit, offset, application, resourceType, verb, undefined, allowedOnly, options);
}
