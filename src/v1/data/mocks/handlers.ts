/**
 * V1 handler composition — wires all V1 handler factories to a V1MockDb.
 *
 * Usage in journey stories:
 * ```ts
 * const db = createV1MockDb(defaultV1Seed());
 * const handlers = createV1Handlers(db, { onDeleteRole: spy });
 * ```
 */

import type { V1MockDb } from './db';
import { type V1RolesHandlerOptions, createV1RolesHandlers } from './roles.handlers';
import { accessHandlers } from './access.handlers';
import { type GroupsHandlerOptions, createGroupsHandlers } from '../../../shared/data/mocks/groups.handlers';
import { type GroupMembersHandlerOptions, createGroupMembersHandlers } from '../../../shared/data/mocks/groupMembers.handlers';
import { type GroupRolesHandlerOptions, createGroupRolesHandlers } from '../../../shared/data/mocks/groupRoles.handlers';
import { type UsersHandlerOptions, createUsersHandlers } from '../../../shared/data/mocks/users.handlers';
import { createPermissionsHandlers } from '../../../shared/data/mocks/permissions.handlers';
import { createServiceAccountsHandlers } from '../../../shared/data/mocks/serviceAccounts.handlers';
import { type AccountManagementHandlerOptions, createAccountManagementHandlers } from '../../../shared/data/mocks/accountManagement.handlers';
import { staticAssetsHandlers } from '../../../shared/data/mocks/staticAssets.handlers';

export interface V1HandlerSpies {
  groups?: Partial<GroupsHandlerOptions>;
  groupMembers?: Partial<GroupMembersHandlerOptions>;
  groupRoles?: Partial<GroupRolesHandlerOptions>;
  users?: Partial<UsersHandlerOptions>;
  roles?: Partial<V1RolesHandlerOptions>;
  accountManagement?: Partial<AccountManagementHandlerOptions>;
}

export function createV1Handlers(db: V1MockDb, spies: V1HandlerSpies = {}) {
  return [
    ...createGroupsHandlers(db.groups, spies.groups),
    ...createGroupMembersHandlers(db.groupMembers, db.groupServiceAccounts, {
      ...spies.groupMembers,
      groups: db.groups,
      users: db.users,
    }),
    ...createGroupRolesHandlers(db.groupRoles, {
      ...spies.groupRoles,
      groups: db.groups,
      allRolesGetter: () => db.roles.all(),
    }),
    ...createUsersHandlers(db.users, spies.users),
    ...createV1RolesHandlers(db.roles, spies.roles),
    ...createPermissionsHandlers(db.permissions.all()),
    ...createServiceAccountsHandlers(db.serviceAccounts.all()),
    ...createAccountManagementHandlers(spies.accountManagement),
    ...accessHandlers(),
    ...staticAssetsHandlers(),
  ];
}
