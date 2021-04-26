import { getRoleApi } from '../shared/user-login';

const roleApi = getRoleApi();

export async function createRole(data) {
  return await roleApi.createRoles(data);
}

export function fetchRoles({
  limit,
  offset,
  name,
  nameMatch,
  scope,
  orderBy = 'display_name',
  addFields,
  username,
  application,
  permission,
  options,
}) {
  return roleApi.listRoles(limit, offset, undefined, name, nameMatch, scope, orderBy, addFields, username, application, permission, options);
}

export async function fetchRolesWithPolicies({
  limit,
  offset,
  filters = {},
  nameMatch,
  scope = 'account',
  orderBy = 'display_name',
  addFields = ['groups_in_count'],
  username,
  options,
  permission,
  application,
  inModal = true,
}) {
  return {
    ...(await roleApi
      .listRoles(limit, offset, undefined, filters.name, nameMatch, scope, orderBy, addFields, username, application, permission, options)
      .then(({ data, meta }) => {
        return {
          data,
          meta,
          ...(inModal
            ? {}
            : {
                filters,
                pagination: {
                  ...meta,
                  offset,
                  limit,
                },
              }),
        };
      })),
    ...(await insights.chrome.auth.getUser()),
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
