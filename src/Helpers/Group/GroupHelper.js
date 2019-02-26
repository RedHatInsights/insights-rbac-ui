
import { getApprovalApi, getGroupApi } from '../Shared/userLogin';

const userApi = getApprovalApi();
const groupApi = getGroupApi();

export async function fetchGroups() {
  let groupsData = await groupApi.listGroups();
  let groups = groupsData.data;
  console.log('Groups: ', groups);
  let len = groups.length;
  for (let idx = 0; idx < len; idx++) {
    let groupWithUsers = await groupApi.getGroup(groups[idx].uuid);
    groups[idx].members = groupWithUsers.principals;
  }
  return groups;
}

export async function updateGroup(data) {
  await groupApi.updateGroup(data.id, data);
}

export async function addGroup(data) {
  let newGroup = await groupApi.createGroup(data);
  groupApi.addPrincipalToGroup(newGroup.uuid, data.user_ids);
  // add selected users to the group
}

export async function removeGroup(groupId) {
  await groupApi.deleteGroup(groupId);
}
