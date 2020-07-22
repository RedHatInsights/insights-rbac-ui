import { getRoleApi } from '../shared/user-login';

const roleApi = getRoleApi();

export async function createRole(data) {
  return await roleApi.createRoles(data);
}

export function fetchRoles({ limit, offset, name, scope, orderBy, addFields, username }) {
  return roleApi.listRoles(limit, offset, name, scope, orderBy, addFields, username);
}

export async function fetchRolesWithPolicies({ limit, offset, name, orderBy }) {
  return {
    ...await roleApi.listRoles(limit, offset, name, 'account', orderBy, [ 'groups_in_count' ]),
    ...await insights.chrome.auth.getUser()
  };
}

export async function fetchRole(uuid) {
  return await roleApi.getRole(uuid);
}

export async function removeRole(roleId) {
  return await roleApi.deleteRole(roleId);
}
