
import { getGroupApi } from '../Shared/userLogin';

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
  await groupApi.updateGroup(data.uuid, data);
  let members_list = data.members.map(user => { return user.username; });
  //update the user members here - adding users and removing users from the group should be a separate action in the UI
  let addUsers = data.user_list.filter(item => !members_list.includes(item.username));
  let removeUsers = members_list.filter(item => !(data.user_list.map(user => { return user.username;})).includes(item));
  if (addUsers.length > 0) {
    await groupApi.addPrincipalToGroup(data.uuid, JSON.stringify({ principals: addUsers }));
  }

  if (removeUsers.length > 0) {
    await groupApi.deletePrincipalFromGroup(data.uuid, removeUsers.join(','));
  }
}

export async function addGroup(data) {
  let newGroup = await groupApi.createGroup(data);
  groupApi.addPrincipalToGroup(newGroup.uuid, JSON.stringify({ principals: data.user_list }));
  // add selected users to the group
}

export async function removeGroup(groupId) {
  await groupApi.deleteGroup(groupId);
}
