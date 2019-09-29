import { getRoleApi, getAxiosInstance } from '../shared/user-login';
import { RBAC_API_BASE } from '../../utilities/constants';

const roleApi = getRoleApi();

export async function createRole(data) {
  return await roleApi.createRoles(data);
}

export const fetchFilterRoles = (filterValue) =>
  getAxiosInstance().get(`${RBAC_API_BASE}/roles/${filterValue.length > 0
    ? `?name=${filterValue}`
    : ''}`)
  .then(({ data }) => data.map(({ uuid, name }) => ({ label: name, value: uuid })));

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

export async function fetchRole(uuid) {
  return await roleApi.getRole(uuid);
}

export async function removeRole(roleId) {
  return await roleApi.deleteRole(roleId);
}
