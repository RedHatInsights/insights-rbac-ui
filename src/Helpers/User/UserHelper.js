import { getApprovalApi } from '../Shared/userLogin';

const userApi = getApprovalApi();

export function fetchUsers() {
  return userApi.fetchUsers();
}
export async function updateUser(data) {
  await userApi.updateUser(data.id, data);
}

export async function addUser(data) {
  await userApi.addUser(data);
}

export async function removeUser(userId) {
  await userApi.destroyUser(userId);
}
