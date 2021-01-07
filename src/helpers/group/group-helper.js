import { getGroupApi } from '../shared/user-login';

const groupApi = getGroupApi();

export async function fetchGroups({ limit, offset, name, nameMatch, scope, username, uuid, roleNames, roleDiscriminator, orderBy, options }) {
  const [groups, auth] = await Promise.all([
    groupApi.listGroups(limit, offset, name, nameMatch, scope, username, uuid, roleNames, roleDiscriminator, orderBy, options),
    insights.chrome.auth.getUser(),
  ]);
  return {
    ...groups,
    ...auth,
  };
}

export async function fetchGroup(uuid) {
  return await groupApi.getGroup(uuid);
}

export async function updateGroup(data) {
  await groupApi.updateGroup(data.uuid, data);
}

export async function addGroup(data) {
  let newGroup = await groupApi.createGroup(data);
  let ret = newGroup;

  if (data.user_list && data.user_list.length > 0) {
    ret = groupApi.addPrincipalToGroup(newGroup.uuid, { principals: data.user_list });
  }

  if (data.roles_list && data.roles_list.length > 0) {
    ret = groupApi.addRoleToGroup(newGroup.uuid, { roles: data.roles_list });
  }

  return ret;
}

export async function removeGroups(uuids) {
  return await Promise.all(uuids.map((uuid) => groupApi.deleteGroup(uuid)));
}

export async function deletePrincipalsFromGroup(groupId, users) {
  return await groupApi.deletePrincipalFromGroup(groupId, users.join(','));
}

export async function addPrincipalsToGroup(groupId, users) {
  return await groupApi.addPrincipalToGroup(groupId, { principals: users });
}

export async function fetchRolesForGroup(groupId, excluded, { limit, offset, name, description }, options = {}) {
  return await groupApi.listRolesForGroup(groupId, excluded, undefined, name, description, limit, offset, 'display_name', options);
}

export async function deleteRolesFromGroup(groupId, roles) {
  return await groupApi.deleteRoleFromGroup(groupId, roles.join(','));
}

export async function addRolesToGroup(groupId, roles) {
  return await groupApi.addRoleToGroup(groupId, { roles });
}

export async function fetchPrincipalsForGroup(groupId, usernames, options = {}) {
  return await groupApi.getPrincipalsFromGroup(groupId, usernames, undefined, {
    query: {
      ...options,
    },
  });
}
