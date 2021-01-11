import { getRoleApi } from '../shared/user-login';

const roleApi = getRoleApi();

export async function createRole(data) {
  return await roleApi.createRoles(data);
}

export function fetchRoles({ limit, offset, name, nameMatch, scope, orderBy, addFields, username, options }) {
  return roleApi.listRoles(limit, offset, name, nameMatch, scope, orderBy, addFields, username, options);
}

export async function fetchRolesWithPolicies({ limit, offset, name, nameMatch, scope = 'account', orderBy, addFields = [ 'groups_in_count' ], username, options }) {
  return {
    ...await roleApi.listRoles(limit, offset, name, nameMatch, scope, orderBy, addFields, username, options),
    ...await insights.chrome.auth.getUser()
  };
}

export async function fetchRole(uuid) {
  return await roleApi.getRole(uuid);
}

export async function removeRole(roleId) {
  return await roleApi.deleteRole(roleId);
}
