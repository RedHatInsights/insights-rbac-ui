/**
 * V2 handler composition — wires all V2 handler factories to a V2MockDb.
 *
 * Usage in journey stories:
 * ```ts
 * const db = createV2MockDb(defaultV2Seed());
 * const handlers = createV2Handlers(db, { onDeleteRole: spy });
 * ```
 */

import type { V2MockDb } from './db';
import { type V2RolesHandlerOptions, createV2RolesHandlers } from './roles.handlers';
import { type WorkspacesHandlerOptions, createWorkspacesHandlers } from './workspaces.handlers';
import { type StatefulRoleBindingsOptions, createStatefulRoleBindingsHandlers } from './roleBindings.handlers';
import { auditHandlers } from './audit.handlers';
import { type GroupsHandlerOptions, createGroupsHandlers } from '../../../shared/data/mocks/groups.handlers';
import { type GroupMembersHandlerOptions, createGroupMembersHandlers } from '../../../shared/data/mocks/groupMembers.handlers';
import { type GroupRolesHandlerOptions, createGroupRolesHandlers } from '../../../shared/data/mocks/groupRoles.handlers';
import { type UsersHandlerOptions, createUsersHandlers } from '../../../shared/data/mocks/users.handlers';
import { createPermissionsHandlers } from '../../../shared/data/mocks/permissions.handlers';
import { createServiceAccountsHandlers } from '../../../shared/data/mocks/serviceAccounts.handlers';
import { type AccountManagementHandlerOptions, createAccountManagementHandlers } from '../../../shared/data/mocks/accountManagement.handlers';
import { staticAssetsHandlers } from '../../../shared/data/mocks/staticAssets.handlers';
import { createCostHandlers } from '../../../shared/data/mocks/cost.handlers';

export interface V2HandlerSpies {
  groups?: Partial<GroupsHandlerOptions>;
  groupMembers?: Partial<GroupMembersHandlerOptions>;
  groupRoles?: Partial<GroupRolesHandlerOptions>;
  users?: Partial<UsersHandlerOptions>;
  roles?: Partial<V2RolesHandlerOptions>;
  workspaces?: Partial<WorkspacesHandlerOptions>;
  roleBindings?: Partial<StatefulRoleBindingsOptions>;
  accountManagement?: Partial<AccountManagementHandlerOptions>;
}

export function createV2Handlers(db: V2MockDb, spies: V2HandlerSpies = {}) {
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
    }),
    ...createUsersHandlers(db.users, spies.users),
    ...createV2RolesHandlers(db.roles, spies.roles),
    ...createWorkspacesHandlers(db.workspaces, spies.workspaces),
    ...createStatefulRoleBindingsHandlers(db.roleBindings, {
      ...spies.roleBindings,
      groups: db.groups,
      workspaces: db.workspaces.all(),
    }),
    ...createPermissionsHandlers(db.permissions.all()),
    ...createServiceAccountsHandlers(db.serviceAccounts.all()),
    ...createAccountManagementHandlers(spies.accountManagement),
    ...auditHandlers(),
    ...createCostHandlers(),
    ...staticAssetsHandlers(),
  ];
}
