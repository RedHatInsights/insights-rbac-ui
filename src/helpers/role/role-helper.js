import { getLastPageOffset, isOffsetValid } from '../shared/pagination';
import { getRoleApi } from '../shared/user-login';

const roleApi = getRoleApi();

export async function createRole(data) {
  return await roleApi.createRole(data);
}

export function fetchRoles({
  limit,
  offset,
  name,
  displayName,
  nameMatch,
  scope,
  orderBy = 'display_name',
  addFields,
  username,
  application,
  permission,
  options,
}) {
  return roleApi.listRoles(
    limit,
    offset,
    name,
    undefined,
    displayName,
    nameMatch,
    scope,
    orderBy,
    addFields,
    username,
    application,
    permission,
    options,
  );
}

export async function fetchRolesWithPolicies({
  limit,
  offset,
  filters = {},
  nameMatch,
  scope = 'org_id',
  orderBy = 'display_name',
  addFields = ['groups_in_count', 'groups_in', 'access'],
  username,
  options,
  permission,
  application,
  usesMetaInURL = false,
  chrome,
}) {
  const roles = await roleApi.listRoles(
    limit,
    offset,
    filters.name,
    undefined,
    filters.display_name,
    nameMatch,
    scope,
    orderBy,
    addFields,
    username,
    application,
    permission,
    options,
  );

  const isPaginationValid = isOffsetValid(offset, roles?.meta?.count);
  offset = isPaginationValid ? offset : getLastPageOffset(roles.meta.count, limit);
  let { data, meta } = isPaginationValid
    ? roles
    : await roleApi.listRoles(
        limit,
        offset,
        filters.name,
        undefined,
        undefined,
        nameMatch,
        scope,
        orderBy,
        addFields,
        username,
        application,
        permission,
        options,
      );

  return {
    data,
    meta,
    ...(usesMetaInURL
      ? {
          filters,
          pagination: {
            ...meta,
            offset,
            limit,
            redirected: !isPaginationValid,
          },
        }
      : {}),
    ...(await chrome?.auth?.getUser()),
  };
}

export async function fetchRole(uuid) {
  return await roleApi.getRole(uuid);
}

export async function fetchRoleForPrincipal(uuid) {
  return await roleApi.getRole(uuid, 'principal');
}

export async function removeRole(roleId) {
  return await roleApi.deleteRole(roleId);
}

export const updateRole = async (roleId, data, useCustomAccess) => {
  const { data: access } = await roleApi.getRoleAccess(roleId);
  return roleApi.updateRole(roleId, useCustomAccess ? { ...data, access } : data);
};

export const removeRolePermissions = async (role, permissionsToRemove) => {
  const { data: access } = await roleApi.getRoleAccess(role.uuid);
  const newRole = { ...role, access: access.filter((item) => !permissionsToRemove.includes(item.permission)) };
  return roleApi.updateRole(role.uuid, { ...newRole });
};

export const patchRole = async (roleId, data) => {
  return roleApi.patchRole(roleId, data);
};
