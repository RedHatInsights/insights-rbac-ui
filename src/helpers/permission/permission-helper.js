import { getAccessApi } from '../shared/user-login';

const accessApi = getAccessApi();

const disallowedPermissions = ['inventory:staleness'];

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
  options,
) {
  const response = await accessApi.listPermissions(
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
    options,
  );

  return {
    ...response,
    data: response.data.filter(({ permission }) => !disallowedPermissions.some((item) => permission.includes(item))),
  };
}

export async function listPermissionOptions(field, limit, offset, application, resourceType, verb, allowedOnly, options) {
  return await accessApi.listPermissionOptions(field, limit, offset, application, resourceType, verb, undefined, allowedOnly, options);
}
