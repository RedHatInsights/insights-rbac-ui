import { getApprovalApi } from '../Shared/userLogin';

const userApi = getApprovalApi();

export function fetchUsersByGroupId() {
  return userApi.fetchUsersByGroupId();
}

export async function fetchGroups() {
  let groups = userApi.fetchGroups();
  console.log('LLLG', groups);
  for (let idx = 0; idx < groups.length; idx++) {
    let users = await fetchUsersByGroupId(groups[idx].id);
    console.log('LLLU', users);
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
