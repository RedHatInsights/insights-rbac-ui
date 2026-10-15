import { describe, expect, it } from 'vitest';
import type { Permission, Role, RolesList200Response } from '../api/roles';
import { createResettableCollection } from '../../../shared/data/mocks/db';
import { DEFAULT_V2_ROLES, DEFAULT_V2_ROLE_PERMISSIONS } from './seed';

/**
 * Type-safety tests for V2 roles handler factory.
 *
 * These tests verify that mock handler responses match the actual
 * @redhat-cloud-services/rbac-client V2 types. When the client updates,
 * type errors here catch shape drift at build time.
 */
describe('V2 Roles Handler Factory - Type Safety', () => {
  it('DEFAULT_V2_ROLES satisfy Role type', () => {
    const roles: Role[] = DEFAULT_V2_ROLES;
    expect(roles.length).toBeGreaterThan(0);

    for (const role of roles) {
      expect(typeof role.id).toBe('string');
      expect(typeof role.name).toBe('string');
      if (role.permissions) {
        for (const perm of role.permissions) {
          const _typedPerm: Permission = perm;
          expect(typeof _typedPerm.application).toBe('string');
          expect(typeof _typedPerm.resource_type).toBe('string');
          expect(typeof _typedPerm.operation).toBe('string');
        }
      }
    }
  });

  it('DEFAULT_V2_ROLE_PERMISSIONS satisfy Permission[] type', () => {
    for (const [roleId, perms] of Object.entries(DEFAULT_V2_ROLE_PERMISSIONS)) {
      const _typed: Permission[] = perms;
      expect(_typed.length).toBeGreaterThan(0);
      expect(roleId).toBeTruthy();
    }
  });

  it('collection CRUD operations preserve Role type', async () => {
    const collection = createResettableCollection<Role>(DEFAULT_V2_ROLES);
    await collection.ready;

    // List
    const all = collection.all();
    const _typedList: Role[] = all;
    expect(_typedList.length).toBe(DEFAULT_V2_ROLES.length);

    // Get
    const single = collection.findFirst((q) => q.where({ id: 'role-tenant-admin' }));
    expect(single).toBeDefined();
    const _typedSingle: Role | undefined = single;
    expect(_typedSingle?.name).toBe('Tenant admin');

    // Create
    const newRole: Role = {
      id: 'role-new',
      name: 'New Role',
      description: 'Test',
      permissions: [{ application: 'test', resource_type: 'res', operation: 'read' }],
      permissions_count: 1,
      last_modified: new Date().toISOString(),
    };
    await collection.create(newRole);
    expect(collection.all().length).toBe(DEFAULT_V2_ROLES.length + 1);

    // Update
    const updated = await collection.update((q) => q.where({ id: 'role-new' }), {
      data(r) {
        r.name = 'Updated Role';
      },
    });
    expect(updated?.name).toBe('Updated Role');

    // Delete
    const deleted = collection.delete((q) => q.where({ id: 'role-new' }));
    expect(deleted).toBeDefined();
    expect(collection.all().length).toBe(DEFAULT_V2_ROLES.length);

    // Reset
    collection.reset();
    await collection.ready;
    expect(collection.all().length).toBe(DEFAULT_V2_ROLES.length);
  });

  it.skip('handler factory creates valid handlers', async () => {
    // Skipped: MSW requires TextEncoder; @mswjs/interceptors loads before setupTests
    // polyfill applies in happy-dom. Handler factory is exercised via Storybook.
    const { createV2RolesHandlers } = await import('./roles.handlers');
    const collection = createResettableCollection<Role>(DEFAULT_V2_ROLES);
    const handlers = createV2RolesHandlers(collection);
    expect(handlers.length).toBe(6);
  });

  it('RolesList200Response type is satisfied by list response shape', () => {
    const response: RolesList200Response = {
      meta: { limit: 20 },
      links: { next: null, previous: null },
      data: DEFAULT_V2_ROLES,
    };
    expect(response.data.length).toBe(DEFAULT_V2_ROLES.length);
    expect(response.meta.limit).toBe(20);
    expect(response.links.next).toBeNull();
  });
});
