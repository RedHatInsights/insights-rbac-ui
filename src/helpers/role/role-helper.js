import { getRoleApi } from '../shared/user-login';

const roleApi = getRoleApi();

export async function fetchRoles({ limit, offset }) {
  let rolesData = await roleApi.listRoles(limit, offset);
  let roles = rolesData.data;
  return roles;
}

export async function fetchRolesWithPolicies({ limit, offset, name, orderBy }) {
  let rolesData = await roleApi.listRoles(limit, offset, name, orderBy);
  let roles = rolesData.data;
  return Promise.all(roles.map(async role => {
    let roleWithPolicies = await roleApi.getRole(role.uuid);
    return { ...role, policies: roleWithPolicies.policyCount };
  })).then(data => ({
    ...rolesData,
    data
  }));
}

export async function fetchRole(id) {
  return await roleApi.getGroup(id);
}
