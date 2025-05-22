import { ListGroupsParams } from '@redhat-cloud-services/rbac-client/ListGroups';
import { GroupPagination } from '@redhat-cloud-services/rbac-client/types';
import { ChromeAPI } from '@redhat-cloud-services/types';
import { getLastPageOffset, isOffsetValid } from '../shared/pagination';
import { getGroupApi } from '../shared/user-login';

interface GroupFilters extends Pick<ListGroupsParams, 'name'> {}

interface GroupResponse extends GroupPagination {
  filters?: GroupFilters;
  pagination?: {
    meta?: {
      count: number;
    };
    offset: number;
    limit: number;
    redirected: boolean;
  };
}

export interface FetchGroupsParams extends Omit<ListGroupsParams, 'name'> {
  filters?: GroupFilters;
  usesMetaInURL?: boolean;
  chrome: ChromeAPI;
}

const groupApi = getGroupApi();

export async function fetchGroups({
  limit,
  offset = 0,
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
}: FetchGroupsParams): Promise<GroupResponse> {
  const [groups, auth] = await Promise.all([
    groupApi.listGroups({
      limit,
      offset,
      name: filters.name,
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
    }),
    chrome?.auth?.getUser(),
  ]);
  const isPaginationValid = isOffsetValid(offset, groups?.data.meta?.count);
  offset = isPaginationValid ? offset : getLastPageOffset(groups!.data.meta!.count!, limit ?? 10);
  const response = isPaginationValid
    ? groups
    : await groupApi.listGroups({
        limit,
        offset,
        name: filters.name,
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
      });
  if (usesMetaInURL) {
    return {
      ...response.data,
      filters,
      pagination: {
        meta: { count: response!.data.meta!.count! },
        offset,
        limit: limit ?? 10,
        redirected: !isPaginationValid,
      },
      ...auth,
    };
  }
  return {
    ...response.data,
    ...auth,
  };
}

export async function fetchGroup(uuid: string) {
  return groupApi.getGroup({ uuid });
}

export type UpdateGroup = {
  uuid: string;
  name: string;
  description?: string;
};

export async function updateGroup(data: UpdateGroup) {
  await groupApi.updateGroup({ uuid: data.uuid, group: { name: data.name, description: data.description } });
}

export type AddGroup = {
  name: string;
  description: string;
  user_list?: string[];
  roles_list?: string[];
};

export async function addGroup({ name, description, user_list, roles_list }: AddGroup) {
  const newGroup = await groupApi.createGroup({
    group: {
      name,
      description,
    },
  });
  const promises: Promise<unknown>[] = [];

  if (user_list && user_list.length > 0) {
    promises.push(
      groupApi.addPrincipalToGroup({
        uuid: newGroup.data.uuid,
        groupPrincipalIn: {
          principals: user_list.map((username) => ({
            username,
            type: 'service-account',
            clientId: undefined as unknown as string, // TODO
          })),
        },
      })
    );
  }

  if (roles_list && roles_list.length > 0) {
    promises.push(groupApi.addRoleToGroup({ uuid: newGroup.data.uuid, groupRoleIn: { roles: roles_list } }));
  }

  await Promise.all(promises);
  return newGroup;
}

export async function removeGroups(uuids: string[]) {
  return Promise.all(uuids.map((uuid) => groupApi.deleteGroup({ uuid })));
}

export async function deleteMembersFromGroup(groupId: string, users: string[]) {
  return groupApi.deletePrincipalFromGroup({
    uuid: groupId,
    usernames: users.join(','),
  });
}

export async function addMembersToGroup(groupId: string, users: string[]) {
  return groupApi.addPrincipalToGroup({
    uuid: groupId,
    groupPrincipalIn: {
      principals: users.map((username) => ({
        username,
        type: 'service-account',
        clientId: undefined as unknown as string, // TODO
      })),
    },
  });
}

export interface FetchRolesOptions {
  limit?: number;
  offset?: number;
  name?: string;
  description?: string;
}

export async function fetchRolesForGroup(groupId: string, excluded: boolean, { limit, offset, name, description }: FetchRolesOptions) {
  return groupApi.listRolesForGroup({
    uuid: groupId,
    exclude: excluded,
    roleName: name || undefined,
    roleDescription: description,
    limit,
    offset,
    orderBy: 'display_name',
  });
}

export interface AddServiceAccount {
  uuid: string;
  username: string;
}

export async function addServiceAccountsToGroup(groupId: string, serviceAccounts: AddServiceAccount[]) {
  return groupApi.addPrincipalToGroup({
    uuid: groupId,
    groupPrincipalIn: {
      principals: serviceAccounts.map((account) => ({
        clientId: account.uuid,
        username: account.username,
        type: 'service-account',
      })),
    },
  });
}

export async function removeServiceAccountsFromGroup(groupId: string, serviceAccountsIds: string[]) {
  return groupApi.deletePrincipalFromGroup({
    uuid: groupId,
    serviceAccounts: serviceAccountsIds.join(','),
  });
}

export interface FetchAccountsOptions {
  serviceAccountClientIds?: string;
  clientId?: string;
  limit?: number;
  offset?: number;
  description?: string;
  name?: string;
}

export async function fetchAccountsForGroup(groupId: string, options: FetchAccountsOptions = {}) {
  return groupApi.getPrincipalsFromGroup({
    uuid: groupId,
    principalUsername: options.serviceAccountClientIds ? undefined : options.clientId,
    limit: options.limit,
    offset: options.offset,
    principalType: options.serviceAccountClientIds ? undefined : 'service-account',
    serviceAccountClientIds: options.serviceAccountClientIds,
    serviceAccountDescription: options.description,
    serviceAccountName: options.name,
  });
}

export async function deleteRolesFromGroup(groupId: string, roles: string[]) {
  return groupApi.deleteRoleFromGroup({ uuid: groupId, roles: roles.join(',') });
}

export async function addRolesToGroup(groupId: string, roles: string[]) {
  return groupApi.addRoleToGroup({ uuid: groupId, groupRoleIn: { roles } });
}

export interface FetchMembersOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'username';
}

export async function fetchMembersForGroup(groupId: string, usernames: string, options: FetchMembersOptions = {}) {
  return groupApi.getPrincipalsFromGroup({
    uuid: groupId,
    principalUsername: usernames,
    limit: options.limit,
    offset: options.offset,
    orderBy: options.orderBy,
  });
}

export async function fetchMemberGroups(username: string) {
  return groupApi.listGroups({
    scope: 'principal',
    username,
  });
}
