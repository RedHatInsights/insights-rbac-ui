import { getLastPageOffset, isOffsetValid } from '../../helpers/pagination';
import { getRoleApi } from '../../api/httpClient';
import { AccessPagination } from '@redhat-cloud-services/rbac-client/types';
import { Access, RoleIn, RolePaginationDynamic, RolePut, RoleWithAccess } from '@redhat-cloud-services/rbac-client/types';
import {
  ListRolesAddFieldsEnum,
  ListRolesNameMatchEnum,
  ListRolesOrderByEnum,
  ListRolesScopeEnum,
} from '@redhat-cloud-services/rbac-client/ListRoles';

const roleApi = getRoleApi();

export async function createRole(data: RoleIn): Promise<RoleWithAccess> {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  return await (roleApi.createRole as any)(data, {});
}

export interface FetchRolesParams {
  limit?: number;
  offset?: number;
  name?: string;
  displayName?: string;
  nameMatch?: ListRolesNameMatchEnum;
  scope?: ListRolesScopeEnum;
  // TODO: Fix this once @redhat-cloud-services/rbac-client library is fixed
  // The ListRolesOrderByEnum is too restrictive and doesn't include all valid orderBy values
  orderBy?: string; // was: ListRolesOrderByEnum;
  addFields?: Array<ListRolesAddFieldsEnum>;
  username?: string;
  application?: string;
  permission?: string;
  usesMetaInURL?: boolean;
  system?: boolean;
}

export async function fetchRoles(params: FetchRolesParams): Promise<RolePaginationDynamic> {
  const { limit, offset, name, displayName, nameMatch, scope, orderBy, addFields, username, application, permission } = params;

  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  return await (roleApi.listRoles as any)(
    limit as number,
    offset as number,
    name as string,
    undefined as unknown as boolean, // system parameter
    displayName as string,
    nameMatch || 'partial',
    scope || 'org_id',
    orderBy as ListRolesOrderByEnum, // Cast needed due to rbac-client library type issues
    addFields || ['groups_in_count'],
    username as string,
    application as string,
    permission as string,
    '', // externalTenant
    {}, // options - always empty object
  );
}

export interface FetchRolesWithPoliciesParams {
  limit?: number;
  offset?: number;
  name?: string;
  nameMatch?: ListRolesNameMatchEnum;
  scope?: ListRolesScopeEnum;
  orderBy?: ListRolesOrderByEnum | string;
  addFields?: Array<ListRolesAddFieldsEnum>;
  username?: string;
  application?: string;
  permission?: string;
  usesMetaInURL?: boolean;
  filters?: {
    name?: string;
    display_name?: string;
  };
  chrome?: any;
}

export async function fetchRolesWithPolicies(params: FetchRolesWithPoliciesParams) {
  const {
    limit,
    offset,
    filters = {},
    nameMatch,
    scope = 'org_id',
    orderBy = 'display_name',
    addFields = ['groups_in_count', 'groups_in', 'access'],
    username,
    permission,
    application,
    usesMetaInURL = false,
    chrome,
  } = params;

  // Convert string orderBy to enum
  const orderByEnum = orderBy as ListRolesOrderByEnum; // Cast needed due to rbac-client library type issues

  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  const roles: RolePaginationDynamic = await (roleApi.listRoles as any)(
    limit as number,
    offset as number,
    filters.name as string,
    undefined as unknown as boolean, // system parameter
    filters.display_name as string,
    nameMatch || 'partial',
    scope,
    orderByEnum,
    addFields,
    username as string,
    application as string,
    permission as string,
    '', // externalTenant
    {}, // options - always empty object
  );

  const isPaginationValid = isOffsetValid(offset, roles?.meta?.count);
  let resultOffset = isPaginationValid ? offset || 0 : getLastPageOffset(roles?.meta?.count || 0, limit || 20);
  let { data, meta } = isPaginationValid
    ? roles
    : await (roleApi.listRoles as any)(
        limit || 20,
        resultOffset,
        filters.name || '',
        false, // system parameter
        '', // displayName
        nameMatch || 'partial',
        scope,
        orderByEnum,
        addFields,
        username || '',
        application || '',
        permission || '',
        '', // externalTenant
        {}, // options - always empty object
      );

  return {
    data,
    meta,
    ...(usesMetaInURL
      ? {
          filters,
          pagination: {
            ...meta,
            offset: resultOffset,
            limit,
            redirected: !isPaginationValid,
          },
        }
      : {}),
    ...(await chrome?.auth?.getUser()),
  };
}

export async function fetchRole(uuid: string): Promise<RoleWithAccess> {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  return await (roleApi.getRole as any)(uuid, 'org_id', {});
}

export async function fetchRoleForPrincipal(uuid: string): Promise<RoleWithAccess> {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  return await (roleApi.getRole as any)(uuid, 'principal', {});
}

export async function removeRole(roleId: string): Promise<void> {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  return await (roleApi.deleteRole as any)(roleId, {});
}

export const updateRole = async (roleId: string, data: RolePut, useCustomAccess?: boolean): Promise<RoleWithAccess> => {
  if (useCustomAccess) {
    // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
    const accessResponse: AccessPagination = await (roleApi.getRoleAccess as any)(roleId, 10, 0, {});
    const access = accessResponse.data;
    return (roleApi.updateRole as any)(roleId, { ...data, access }, {});
  }
  return (roleApi.updateRole as any)(roleId, data, {});
};

export const removeRolePermissions = async (role: RoleWithAccess, permissionsToRemove: string[]): Promise<RoleWithAccess> => {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  const accessResponse: AccessPagination = await (roleApi.getRoleAccess as any)(role.uuid, 10, 0, {});
  const access = accessResponse.data;
  const filteredAccess = access.filter((item: Access) => !permissionsToRemove.includes(item.permission));
  const newRoleData: RolePut = {
    name: role.name || '',
    display_name: role.display_name,
    description: role.description,
    access: filteredAccess,
  };
  return (roleApi.updateRole as any)(role.uuid, newRoleData, {});
};

export const patchRole = async (roleId: string, data: Partial<RoleIn>): Promise<RoleWithAccess> => {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  return (roleApi.patchRole as any)(roleId, data, {});
};
