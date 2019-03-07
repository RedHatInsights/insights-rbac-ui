import { getPrincipalApi } from '../Shared/userLogin';

const principalApi = getPrincipalApi();

export async function fetchUsers() {
  let usersData = await principalApi.listPrincipals();
  let users = usersData.data;
  return users;
}

export async function updateUser(data) {
  await principalApi.updateUser(data.id, data);
}

