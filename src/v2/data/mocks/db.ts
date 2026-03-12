import type { RoleBindingsRoleBindingBySubject } from '../api/workspaces';
import type { WorkspacesWorkspace } from '../api/workspaces';
import type { Role, Permission as V2Permission } from '../api/roles';
import type {
  Group,
  MockServiceAccount,
  Permission,
  Principal,
  ResettableMap,
  ResettableMockCollection,
  RoleOut,
  ServiceAccount,
} from '../../../shared/data/mocks/db';
import { createResettableCollection, createResettableMap } from '../../../shared/data/mocks/db';

export type { WorkspacesWorkspace } from '../api/workspaces';
export type { Permission, Role } from '../api/roles';
export type { RoleBindingsRoleBindingBySubject } from '../api/workspaces';
export type { MockCollection, ResettableMockCollection, MockServiceAccount, ResettableMap } from '../../../shared/data/mocks/db';
export { createSeededCollection, createResettableCollection, createResettableMap, paginate } from '../../../shared/data/mocks/db';

// ---------------------------------------------------------------------------
// V2 Mock Database
// ---------------------------------------------------------------------------

export interface V2MockDb {
  groups: ResettableMockCollection<Group>;
  users: ResettableMockCollection<Principal>;
  roles: ResettableMockCollection<Role>;
  workspaces: ResettableMockCollection<WorkspacesWorkspace>;
  permissions: ResettableMockCollection<Permission>;
  serviceAccounts: ResettableMockCollection<MockServiceAccount>;
  groupMembers: ResettableMap<string, Principal[]>;
  groupServiceAccounts: ResettableMap<string, ServiceAccount[]>;
  groupRoles: ResettableMap<string, RoleOut[]>;
  roleBindings: ResettableMap<string, RoleBindingsRoleBindingBySubject[]>;
  rolePermissions: ResettableMap<string, V2Permission[]>;
  reset(): void;
  /** Resolves when all collections have finished repopulating after reset (for test isolation) */
  ready: Promise<void>;
}

export interface V2Seed {
  groups?: Group[];
  users?: Principal[];
  roles?: Role[];
  workspaces?: WorkspacesWorkspace[];
  permissions?: Permission[];
  serviceAccounts?: MockServiceAccount[];
  groupMembers?: Iterable<[string, Principal[]]>;
  groupServiceAccounts?: Iterable<[string, ServiceAccount[]]>;
  groupRoles?: Iterable<[string, RoleOut[]]>;
  roleBindings?: Iterable<[string, RoleBindingsRoleBindingBySubject[]]>;
  rolePermissions?: Iterable<[string, V2Permission[]]>;
}

export function createV2MockDb(seed: V2Seed = {}): V2MockDb {
  const groups = createResettableCollection<Group>(seed.groups ?? []);
  const users = createResettableCollection<Principal>(seed.users ?? []);
  const roles = createResettableCollection<Role>(seed.roles ?? []);
  const workspaces = createResettableCollection<WorkspacesWorkspace>(seed.workspaces ?? []);
  const permissions = createResettableCollection<Permission>(seed.permissions ?? []);
  const serviceAccounts = createResettableCollection<MockServiceAccount>(seed.serviceAccounts ?? []);
  const groupMembers = createResettableMap<string, Principal[]>(seed.groupMembers ?? []);
  const groupServiceAccounts = createResettableMap<string, ServiceAccount[]>(seed.groupServiceAccounts ?? []);
  const groupRoles = createResettableMap<string, RoleOut[]>(seed.groupRoles ?? []);
  const roleBindings = createResettableMap<string, RoleBindingsRoleBindingBySubject[]>(seed.roleBindings ?? []);
  const rolePermissions = createResettableMap<string, V2Permission[]>(seed.rolePermissions ?? []);

  const db: V2MockDb = {
    groups,
    users,
    roles,
    workspaces,
    permissions,
    serviceAccounts,
    groupMembers,
    groupServiceAccounts,
    groupRoles,
    roleBindings,
    rolePermissions,
    ready: Promise.all([groups.ready, users.ready, roles.ready, workspaces.ready, permissions.ready, serviceAccounts.ready]).then(() => {}),
    reset() {
      groups.reset();
      users.reset();
      roles.reset();
      workspaces.reset();
      permissions.reset();
      serviceAccounts.reset();
      groupMembers.reset();
      groupServiceAccounts.reset();
      groupRoles.reset();
      roleBindings.reset();
      rolePermissions.reset();
      db.ready = Promise.all([groups.ready, users.ready, roles.ready, workspaces.ready, permissions.ready, serviceAccounts.ready]).then(() => {});
    },
  };

  return db;
}
