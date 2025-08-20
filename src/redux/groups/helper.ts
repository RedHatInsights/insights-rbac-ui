import { getLastPageOffset, isOffsetValid } from '../../helpers/pagination';
import { getGroupApi } from '../../api/httpClient';
import {
  AllPrincipalsPagination,
  Group,
  GroupOut,
  GroupPagination,
  GroupPrincipalIn,
  GroupWithPrincipalsAndRoles,
  PrincipalIn,
} from '@redhat-cloud-services/rbac-client/types';
import {
  ListGroupsNameMatchEnum,
  ListGroupsOrderByEnum,
  ListGroupsRoleDiscriminatorEnum,
  ListGroupsScopeEnum,
} from '@redhat-cloud-services/rbac-client/ListGroups';
import { GetPrincipalsFromGroupPrincipalTypeEnum } from '@redhat-cloud-services/rbac-client/GetPrincipalsFromGroup';

const groupApi = getGroupApi();

export interface FetchGroupsParams {
  limit?: number;
  offset?: number;
  nameMatch?: string;
  scope?: ListGroupsScopeEnum;
  username?: string;
  excludeUsername?: string;
  filters?: { name?: string };
  uuid?: string;
  roleNames?: string[];
  roleDiscriminator?: string;
  orderBy?: ListGroupsOrderByEnum;
  platformDefault?: boolean;
  adminDefault?: boolean;
  system?: boolean;
  usesMetaInURL?: boolean;
  chrome?: { auth?: { getUser?: () => Promise<any> } };
}

export interface FetchRolesForGroupParams {
  limit?: number;
  offset?: number;
  name?: string;
  description?: string;
}

export interface FetchAccountsForGroupParams {
  serviceAccountClientIds?: string;
  clientId?: string;
  limit?: number;
  offset?: number;
  description?: string;
  name?: string;
}

export interface FetchMembersForGroupParams {
  limit?: number;
  offset?: number;
  orderBy?: string;
}

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
  usesMetaInURL = false,
  chrome,
}: FetchGroupsParams): Promise<
  GroupPagination & {
    filters?: { name?: string };
    pagination?: any;
    [key: string]: any;
  }
> {
  const [groups, auth] = await Promise.all([
    // NOTE: @redhat-cloud-services/rbac-client has completely broken TypeScript types
    // - API expects undefined for optional parameters, not explicit defaults like limit || 20
    // - Parameters must be undefined instead of empty strings, false, or 0 to work correctly
    // - Using (apiMethod as any) to bypass the broken type definitions
    (groupApi.listGroups as any)(
      limit,
      offset,
      filters.name,
      nameMatch ? (nameMatch as ListGroupsNameMatchEnum) : undefined,
      scope,
      username,
      excludeUsername,
      uuid ? [uuid] : undefined,
      roleNames,
      roleDiscriminator ? (roleDiscriminator as ListGroupsRoleDiscriminatorEnum) : undefined,
      orderBy,
      platformDefault,
      adminDefault,
      system,
      {},
    ),
    chrome?.auth?.getUser?.() || Promise.resolve({}),
  ]);
  const isPaginationValid = isOffsetValid(offset, groups?.meta?.count);
  const validOffset = isPaginationValid ? offset : getLastPageOffset(groups.meta?.count || 0, limit || 20);
  let response = isPaginationValid
    ? groups
    : await (groupApi.listGroups as any)(
        limit,
        validOffset,
        filters.name,
        nameMatch ? (nameMatch as ListGroupsNameMatchEnum) : undefined,
        scope,
        username,
        excludeUsername,
        uuid ? [uuid] : undefined,
        roleNames,
        roleDiscriminator ? (roleDiscriminator as ListGroupsRoleDiscriminatorEnum) : undefined,
        orderBy,
        platformDefault,
        adminDefault,
        system,
        {},
      );
  return {
    ...response,
    ...(usesMetaInURL
      ? {
          filters,
          pagination: {
            ...response?.meta,
            offset: validOffset,
            limit,
            redirected: !isPaginationValid,
          },
        }
      : {}),
    ...auth,
  };
}

export async function fetchGroup(uuid: string): Promise<GroupWithPrincipalsAndRoles> {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  return await (groupApi.getGroup as any)(uuid, undefined);
}

export async function updateGroup(data: Group & { uuid: string }): Promise<GroupOut> {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  return await (groupApi.updateGroup as any)(data.uuid, data, undefined);
}

export async function addGroup(
  data: Group & {
    user_list?: PrincipalIn[];
    roles_list?: string[];
  },
): Promise<GroupOut> {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  let newGroup = await (groupApi.createGroup as any)(data, undefined);
  const promises = [];

  if (data.user_list && data.user_list.length > 0) {
    const groupPrincipalIn: GroupPrincipalIn = {
      principals: data.user_list.map((user) => ({
        username: user.username || '',
        type: 'user' as any,
        clientId: '',
      })),
    };
    // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
    promises.push((groupApi.addPrincipalToGroup as any)(newGroup.uuid || '', groupPrincipalIn, undefined));
  }

  if (data.roles_list && data.roles_list.length > 0) {
    // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
    promises.push((groupApi.addRoleToGroup as any)(newGroup.uuid || '', { roles: data.roles_list }, undefined));
  }

  await Promise.all(promises);
  return newGroup;
}

export async function removeGroups(uuids: string[]): Promise<void[]> {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  const results = await Promise.all(uuids.map((uuid) => (groupApi.deleteGroup as any)(uuid, undefined)));
  return results.map(() => undefined);
}

export async function deleteMembersFromGroup(groupId: string, users: string[]): Promise<void> {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  await (groupApi.deletePrincipalFromGroup as any)(groupId, users.join(','), '', undefined);
}

export async function addMembersToGroup(groupId: string, users: PrincipalIn[]): Promise<void> {
  const groupPrincipalIn: GroupPrincipalIn = {
    principals: users.map((user) => ({
      username: user.username || '',
      type: 'user' as any,
      clientId: '',
    })),
  };
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  await (groupApi.addPrincipalToGroup as any)(groupId, groupPrincipalIn, undefined);
}

export async function fetchRolesForGroup(groupId: string, excluded?: boolean, params: FetchRolesForGroupParams = {}): Promise<any> {
  const { limit, offset, name, description } = params;

  return await (groupApi.listRolesForGroup as any)(
    groupId,
    excluded,
    undefined, // addFields - undefined instead of empty string
    name, // name - undefined if not provided
    description, // description - undefined if not provided
    undefined, // system - undefined instead of false
    undefined, // externalTenant - undefined instead of empty string
    limit, // limit - undefined instead of default 20
    offset, // offset - undefined instead of default 0
    'display_name' as any,
    undefined, // options - undefined instead of empty object
  );
}

export async function addServiceAccountsToGroup(groupId: string, serviceAccounts: Array<{ uuid: string }>): Promise<void> {
  const groupPrincipalIn: { principals: { clientId: string; type: string }[] } = {
    principals: serviceAccounts.map((account) => ({
      clientId: account.uuid,
      type: 'service-account' as any,
    })),
  };
  await (groupApi.addPrincipalToGroup as any)(groupId, groupPrincipalIn, undefined);
}

export async function removeServiceAccountsFromGroup(groupId: string, serviceAccountsIds: string[]): Promise<void> {
  console.log(groupId, 'this is groupId!!!!');
  await (groupApi.deletePrincipalFromGroup as any)(groupId, undefined, serviceAccountsIds.join(','), undefined);
}

export async function fetchAccountsForGroup(groupId: string, options: FetchAccountsForGroupParams = {}): Promise<AllPrincipalsPagination> {
  console.log(options.serviceAccountClientIds, 'what is this?');
  const response = await (groupApi.getPrincipalsFromGroup as any)(
    groupId,
    undefined, // adminOnly - undefined instead of false
    options.serviceAccountClientIds ? undefined : options.clientId, // clientId - undefined if fetching service accounts
    options.limit,
    options.offset,
    undefined, // orderBy - undefined instead of 'username'
    undefined, // adminOnly second param - undefined instead of false
    GetPrincipalsFromGroupPrincipalTypeEnum.ServiceAccount, // principalType - service account if serviceAccountClientIds provided, otherwise user
    undefined, // serviceAccountClientIds
    options.description,
    options.name,
    undefined, // options - undefined instead of empty object
  );

  // Return response directly like original - responseInterceptor handles unwrapping
  return response as AllPrincipalsPagination;
}

export async function deleteRolesFromGroup(groupId: string, roles: string[]): Promise<void> {
  await (groupApi.deleteRoleFromGroup as any)(groupId, roles.join(','), undefined);
}

export async function addRolesToGroup(groupId: string, roles: string[]): Promise<void> {
  await (groupApi.addRoleToGroup as any)(groupId, { roles }, undefined);
}

export async function fetchMembersForGroup(
  groupId: string,
  usernames?: string,
  params: FetchMembersForGroupParams = {},
): Promise<AllPrincipalsPagination> {
  const { limit, offset, orderBy } = params;

  const response = await (groupApi.getPrincipalsFromGroup as any)(
    groupId,
    undefined, // adminOnly - undefined instead of false
    usernames, // clientId/usernames - undefined if not provided
    limit,
    offset,
    orderBy, // orderBy - undefined instead of default 'username'
    undefined, // adminOnly second param - undefined instead of false
    GetPrincipalsFromGroupPrincipalTypeEnum.User, // principalType - always user for members
    undefined, // serviceAccountClientIds - undefined for users
    undefined, // description - undefined
    undefined, // name - undefined
    undefined, // options - undefined instead of empty object
  );

  // Return response directly like original - responseInterceptor handles unwrapping
  return response as AllPrincipalsPagination;
}

export async function fetchMemberGroups(username: string): Promise<GroupPagination> {
  return await groupApi.listGroups(
    20,
    0,
    '',
    ListGroupsNameMatchEnum.Partial,
    ListGroupsScopeEnum.Principal,
    username,
    '',
    [],
    [],
    ListGroupsRoleDiscriminatorEnum.All,
    ListGroupsOrderByEnum.Name,
    false,
    false,
    false,
    {},
  );
}
