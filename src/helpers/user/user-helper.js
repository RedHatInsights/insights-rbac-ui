import { getPrincipalApi } from '../shared/user-login';

const principalApi = getPrincipalApi();

export async function fetchUsers() {
  let usersData = await principalApi.listPrincipals();
  let users = usersData.data;
  return users;
}
