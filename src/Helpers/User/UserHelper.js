import { getApprovalApi, getPrincipalApi } from '../Shared/userLogin';

const userApi = getApprovalApi();
const principalApi = getPrincipalApi();

export async function fetchUsersApproval() {
  let users = await userApi.fetchUsers();
  let len = users.length;
  for (let idx = 0; idx < len; idx++) {
    let groups = [];
    // TODO  - uncomment when the API is fixed
    //groups = await userApi.fetchGroupsByUserId(users[idx].id);
    users[idx].groups = groups;
  }
  return users;
}

export async function fetchUsers() {
  let usersData = await principalApi.listPrincipals();
  let users = usersData.data;
  return users;
}

export async function updateUser(data) {
  await userApi.updateUser(data.id, data);
}

export async function addUser(data) {
  await userApi.addUser(data);
}

export async function removeUser(userId) {
  await userApi.removeUser(userId);
}
