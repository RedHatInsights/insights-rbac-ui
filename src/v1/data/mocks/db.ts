import type { RoleOutDynamic } from '../api/roles';
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

export type { RoleOutDynamic } from '../api/roles';
export type { MockCollection, ResettableMockCollection, MockServiceAccount, ResettableMap } from '../../../shared/data/mocks/db';
export { createSeededCollection, createResettableCollection, createResettableMap, paginate } from '../../../shared/data/mocks/db';

// ---------------------------------------------------------------------------
// V1 Mock Database
// ---------------------------------------------------------------------------

export interface V1MockDb {
  groups: ResettableMockCollection<Group>;
  users: ResettableMockCollection<Principal>;
  roles: ResettableMockCollection<RoleOutDynamic>;
  permissions: ResettableMockCollection<Permission>;
  serviceAccounts: ResettableMockCollection<MockServiceAccount>;
  groupMembers: ResettableMap<string, Principal[]>;
  groupServiceAccounts: ResettableMap<string, ServiceAccount[]>;
  groupRoles: ResettableMap<string, RoleOut[]>;
  reset(): void;
  /** Resolves when all collections have finished repopulating after reset (for test isolation) */
  ready: Promise<void>;
}

export interface V1Seed {
  groups?: Group[];
  users?: Principal[];
  roles?: RoleOutDynamic[];
  permissions?: Permission[];
  serviceAccounts?: MockServiceAccount[];
  groupMembers?: Iterable<[string, Principal[]]>;
  groupServiceAccounts?: Iterable<[string, ServiceAccount[]]>;
  groupRoles?: Iterable<[string, RoleOut[]]>;
}

export function createV1MockDb(seed: V1Seed = {}): V1MockDb {
  const groups = createResettableCollection<Group>(seed.groups ?? []);
  const users = createResettableCollection<Principal>(seed.users ?? []);
  const roles = createResettableCollection<RoleOutDynamic>(seed.roles ?? []);
  const permissions = createResettableCollection<Permission>(seed.permissions ?? []);
  const serviceAccounts = createResettableCollection<MockServiceAccount>(seed.serviceAccounts ?? []);
  const groupMembers = createResettableMap<string, Principal[]>(seed.groupMembers ?? []);
  const groupServiceAccounts = createResettableMap<string, ServiceAccount[]>(seed.groupServiceAccounts ?? []);
  const groupRoles = createResettableMap<string, RoleOut[]>(seed.groupRoles ?? []);

  const db: V1MockDb = {
    groups,
    users,
    roles,
    permissions,
    serviceAccounts,
    groupMembers,
    groupServiceAccounts,
    groupRoles,
    ready: Promise.all([groups.ready, users.ready, roles.ready, permissions.ready, serviceAccounts.ready]).then(() => {}),
    reset() {
      groups.reset();
      users.reset();
      roles.reset();
      permissions.reset();
      serviceAccounts.reset();
      groupMembers.reset();
      groupServiceAccounts.reset();
      groupRoles.reset();
      db.ready = Promise.all([groups.ready, users.ready, roles.ready, permissions.ready, serviceAccounts.ready]).then(() => {});
    },
  };

  return db;
}
