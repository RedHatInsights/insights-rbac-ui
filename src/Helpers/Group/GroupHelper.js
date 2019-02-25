
import { getApprovalApi } from '../Shared/userLogin';

const userApi = getApprovalApi();

export async function fetchGroups() {
  let groups = await userApi.fetchGroups();
  console.log('Groups: ', groups);
  let len = groups.length;
  for (let idx = 0; idx < len; idx++) {
    let users = await userApi.fetchUsersByGroupId(groups[idx].id);
    groups[idx].members = users;
  }
  return groups;
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
