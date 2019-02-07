
import { getApprovalApi } from '../Shared/userLogin';

const userApi = getApprovalApi();

export function fetchUsersByGroupId(id) {
  return userApi.fetchUsersByGroupId(id);
}

export async function fetchGroups() {
  let groups = await userApi.fetchGroups();
  console.log('LLLG', groups);
  let len = groups.length;
  console.log('LLLLength', len);

  for (let idx = 0; idx < len; idx++) {
    console.log('LLLLI', groups, idx, groups[idx], groups[idx].id);
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
