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
  usesMetaInURL = false,
  chrome,
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
      options,
    ),
    chrome?.auth?.getUser(),
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
        adminDefault,
      );
  return {
    ...response,
    ...(usesMetaInURL
      ? {
          filters,
          pagination: {
            ...response?.meta,
            offset,
            limit,
            redirected: !isPaginationValid,
          },
        }
      : {}),
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

export async function deleteMembersFromGroup(groupId, users) {
  return await groupApi.deletePrincipalFromGroup(groupId, users.join(','));
}

export async function addMembersToGroup(groupId, users) {
  return await groupApi.addPrincipalToGroup(groupId, { principals: users });
}

export async function fetchRolesForGroup(groupId, excluded, { limit, offset, name, description }, options = {}) {
  return await groupApi.listRolesForGroup(
    groupId,
    excluded,
    undefined,
    name || undefined,
    description || undefined,
    undefined,
    undefined,
    limit || undefined,
    offset || undefined,
    'display_name',
    options,
  );
}

export async function addServiceAccountsToGroup(groupId, serviceAccounts) {
  return await groupApi.addPrincipalToGroup(groupId, {
    principals: serviceAccounts.map((account) => ({ clientId: account.uuid, type: 'service-account' })),
  });
}

export async function removeServiceAccountsFromGroup(groupId, serviceAccountsIds) {
  return await groupApi.deletePrincipalFromGroup(groupId, undefined, serviceAccountsIds.join(','));
}

export async function fetchAccountsForGroup(groupId, options = {}) {
  return await groupApi.getPrincipalsFromGroup(
    groupId,
    undefined,
    options.serviceAccountClientIds ? undefined : options.clientId,
    options.limit,
    options.offset,
    undefined,
    undefined,
    options.serviceAccountClientIds ? undefined : 'service-account',
    options.serviceAccountClientIds,
    options.description,
    options.name,
  );
}

export async function deleteRolesFromGroup(groupId, roles) {
  return await groupApi.deleteRoleFromGroup(groupId, roles.join(','));
}

export async function addRolesToGroup(groupId, roles) {
  return await groupApi.addRoleToGroup(groupId, { roles });
}

export async function fetchMembersForGroup(groupId, usernames, options = {}) {
  return await groupApi.getPrincipalsFromGroup(groupId, undefined, usernames, options.limit, options.offset, options.orderBy);
}

export async function fetchMemberGroups(username) {
  return await groupApi.listGroups(undefined, undefined, undefined, undefined, 'principal', username, undefined);
}
