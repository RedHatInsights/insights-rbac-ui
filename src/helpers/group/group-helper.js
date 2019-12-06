import { getGroupApi } from '../shared/user-login';

const groupApi = getGroupApi();

export async function fetchGroups({ limit, offset, name, orderBy }) {
  const [ groups, auth ] = await Promise.all([
    groupApi.listGroups(limit, offset, name, orderBy),
    insights.chrome.auth.getUser()
  ]);
  return {
    ...groups,
    ...auth
  };
}

export async function fetchGroup(uuid) {
  return await groupApi.getGroup(uuid);
}

export async function updateGroup(data) {
  await groupApi.updateGroup(data.uuid, data);

  const members_list = data.principals ? data.principals.map(user => user.username) : [];
  let addUsers = data.user_list.filter(item => !members_list.includes(item.username));
  let removeUsers = members_list.filter(item => !(data.user_list.map(user => user.username).includes(item)));
  if (addUsers.length > 0) {
    await groupApi.addPrincipalToGroup(data.uuid, { principals: addUsers });
  }

  if (removeUsers.length > 0) {
    await groupApi.deletePrincipalFromGroup(data.uuid, removeUsers.join(','));
  }
}

export async function addGroup(data) {
  let newGroup = await groupApi.createGroup(data);
  if (data.user_list && data.user_list.length > 0) {
    return groupApi.addPrincipalToGroup(newGroup.uuid, { principals: data.user_list });
  }

  return newGroup;
}

export async function removeGroup(groupId) {
  return await groupApi.deleteGroup(groupId);
}

export async function deletePrincipalsFromGroup(groupId, users) {
  return await groupApi.deletePrincipalFromGroup(groupId, users.join(','));
}

export async function addPrincipalsToGroup(groupId, users) {
  return await groupApi.addPrincipalToGroup(groupId, { principals: users });
}

export async function fetchRolesForGroup(groupId) {
  return await groupApi.listRolesForGroup(groupId);
}

export async function deleteRolesFromGroup(groupId, roles) {
  return await groupApi.deleteRoleFromGroup(groupId, roles.join(','));
}

export async function addRolesToGroup(groupId, roles) {
  return await groupApi.addRoleToGroup(groupId, { roles });
}

