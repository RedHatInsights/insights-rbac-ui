import { getLastPageOffset, isOffsetValid } from '../shared/pagination';
import { getGroupApi } from '../shared/user-login';

const groupApi = getGroupApi();

export async function fetchGroups({
  limit,
  offset,
  nameMatch,
  scope,
  username,
  excludeUsername,
  filters = {},
  uuid,
  roleNames,
  roleDiscriminator,
  orderBy,
  platformDefault,
  adminDefault,
  system,
  options,
  inModal = true,
}) {
  const [groups, auth] = await Promise.all([
    groupApi.listGroups(
      limit,
      offset,
      filters.name,
      nameMatch,
      scope,
      username,
      excludeUsername,
      uuid,
      roleNames,
      roleDiscriminator,
      orderBy,
      platformDefault,
      adminDefault,
      system,
      options
    ),
    insights.chrome.auth.getUser(),
  ]);
  const isPaginationValid = isOffsetValid(offset, groups?.meta?.count);
  offset = isPaginationValid ? offset : getLastPageOffset(groups.meta.count, limit);
  let response = isPaginationValid
    ? groups
    : await groupApi.listGroups(
        limit,
        offset,
        filters.name,
        nameMatch,
        scope,
        username,
        uuid,
        roleNames,
        roleDiscriminator,
        orderBy,
        options,
        system,
        platformDefault,
        adminDefault
      );
  return {
    ...response,
    ...(inModal
      ? {}
      : {
          filters,
          pagination: {
            ...response?.meta,
            offset,
            limit,
            redirected: !isPaginationValid,
          },
        }),
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
  const promises = [];

  if (data.user_list && data.user_list.length > 0) {
    promises.push(groupApi.addPrincipalToGroup(newGroup.uuid, { principals: data.user_list }));
  }

  if (data.roles_list && data.roles_list.length > 0) {
    promises.push(groupApi.addRoleToGroup(newGroup.uuid, { roles: data.roles_list }));
  }

  await Promise.all(promises);
  return newGroup;
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
  return await groupApi.listRolesForGroup(
    groupId,
    excluded,
    undefined,
    name,
    description,
    undefined,
    undefined,
    limit,
    offset,
    'display_name',
    options
  );
}

export async function deleteRolesFromGroup(groupId, roles) {
  return await groupApi.deleteRoleFromGroup(groupId, roles.join(','));
}

export async function addRolesToGroup(groupId, roles) {
  return await groupApi.addRoleToGroup(groupId, { roles });
}

export async function fetchPrincipalsForGroup(groupId, usernames, options = {}) {
  return await groupApi.getPrincipalsFromGroup(groupId, usernames, options.limit, options.offset, options.orderBy);
}

export async function fetchPrincipalGroups(username) {
  return await groupApi.listGroups(undefined, undefined, undefined, undefined, 'principal', username, undefined);
}
