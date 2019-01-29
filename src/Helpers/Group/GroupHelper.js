import { getApprovalApi } from '../Shared/userLogin';

const userApi = getApprovalApi();

export function fetchGroups() {
  return userApi.fetchGroups();
}
export async function updateGroup(data) {
  await userApi.updateGroup(data.id, data);
}
export async function addGroup(data) {
  await userApi.addGroup(data);
}

export async function removeGroup(groupId) {
  await userApi.removeGroup(groupId);
}
