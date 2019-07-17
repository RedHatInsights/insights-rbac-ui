import { getRoleApi } from '../shared/user-login';

const roleApi = getRoleApi();

export async function fetchRoles({ limit, offset }) {
  let rolesData = await roleApi.listRoles(limit, offset);
  let roles = rolesData.data;
  return roles;
}

export async function fetchRole(id) {
  return await roleApi.getGroup(id);
}
