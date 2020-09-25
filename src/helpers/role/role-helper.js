import { getRoleApi } from '../shared/user-login';

const roleApi = getRoleApi();

export async function createRole(data) {
  return await roleApi.createRoles(data);
}

export function fetchRoles({ limit, offset, name, nameMatch, scope, orderBy, addFields, username, application, options }) {
  return roleApi.listRoles(limit, offset, name, nameMatch, scope, orderBy, addFields, username, application, options);
}

export async function fetchRolesWithPolicies({
  limit,
  offset,
  name,
  nameMatch,
  scope = 'account',
  orderBy,
  addFields = ['groups_in_count'],
  username,
  options,
}) {
  return {
    ...(await roleApi.listRoles(limit, offset, name, nameMatch, scope, orderBy, addFields, username, options)),
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

export const updateRole = async (roleId, data) => {
  const { data: access } = await roleApi.getRoleAccess(roleId);
  return roleApi.updateRole(roleId, { ...data, access });
};

export const removeRolePermissions = async (role, permissionsToRemove) => {
  const { data: access } = await roleApi.getRoleAccess(role.uuid);
  const newRole = { ...role, access: access.filter((item) => !permissionsToRemove.includes(item.permission)) };
  return roleApi.updateRole(role.uuid, { ...newRole });
};
