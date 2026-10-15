/**
 * Mock database utilities powered by @msw/data.
 *
 * Generic collection helpers shared by V1 and V2 handler factories.
 * Version-specific types and collections live in src/{v1,v2}/data/mocks/db.ts.
 *
 * Uses z.custom<T>() to reuse existing TypeScript types from rbac-client
 * without duplicating field definitions in Zod schemas.
 */

import { Collection } from '@msw/data';
import type { ZodType } from 'zod';
import { z } from 'zod';

export type { Group, PaginatedResponse } from '../queries/groups';
export type { GroupOut, RoleOut, ServiceAccount } from '../api/groups';
export type { Principal } from '../api/users';
export type { Permission } from '../api/permissions';

export interface MockServiceAccount {
  uuid: string;
  name: string;
  clientId: string;
  owner: string;
  timeCreated: string;
  description: string;
}

/**
 * Collection<Schema> is parameterized by the Zod schema, not the data type.
 * This alias maps `MockCollection<T>` → `Collection<ZodType<T>>` so handler
 * signatures stay clean while TypeScript correctly infers field types for
 * `.findFirst()`, `.findMany()`, `.update()`, etc.
 */
export type MockCollection<T> = Collection<ZodType<T>>;

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/** Paginate a pre-filtered array (for handlers that filter before paginating) */
export function paginate<T>(items: T[], offset: number, limit: number): { data: T[]; meta: { count: number; limit: number; offset: number } } {
  return {
    data: items.slice(offset, offset + limit),
    meta: { count: items.length, limit, offset },
  };
}

/**
 * Create a standalone MockCollection seeded with the given items.
 * Useful for convenience wrappers in handler factories.
 */
export function createSeededCollection<T>(items: T[]): MockCollection<T> {
  const col = new Collection({ schema: z.custom<T>() });
  for (const item of items) {
    col.create(item);
  }
  return col;
}

/**
 * A MockCollection with `reset()` for test isolation and `ready` to await
 * async population. `Collection.create()` is async in @msw/data — handlers
 * don't need to wait (microtasks resolve before the first request), but
 * tests that query immediately after creation should `await collection.ready`.
 */
export type ResettableMockCollection<T> = MockCollection<T> & {
  reset(): void;
  ready: Promise<void>;
};

/**
 * Create a MockCollection that can be reset to its initial state.
 * Use in story files where you need CRUD + test isolation.
 */
export function createResettableCollection<T>(items: T[]): ResettableMockCollection<T> {
  const col = new Collection({ schema: z.custom<T>() }) as ResettableMockCollection<T>;
  const snapshot = JSON.parse(JSON.stringify(items)) as T[];
  let generation = 0;

  const batchPopulate = (data: T[], gen: number): Promise<void> =>
    col
      .createMany(data.length, (i) => data[i])
      .then(() => {
        if (gen !== generation) col.clear();
      });

  generation++;
  col.ready = batchPopulate(items, generation);
  col.reset = () => {
    generation++;
    col.clear();
    col.ready = batchPopulate(snapshot, generation);
  };
  return col;
}

// ---------------------------------------------------------------------------
// Resettable Map (for relational join data)
// ---------------------------------------------------------------------------

/**
 * A Map with `reset()` that restores the original entries.
 * Used for relational data (group→members, group→roles, etc.) that lives
 * alongside Collections in a MockDb.
 */
export type ResettableMap<K, V> = Map<K, V> & { reset(): void };

/**
 * Create a Map that can be reset to its initial entries.
 * Values are deep-cloned on creation and on every reset so mutations
 * inside handlers never corrupt the snapshot.
 */
export function createResettableMap<K, V>(entries: Iterable<[K, V]> = []): ResettableMap<K, V> {
  const snapshot = Array.from(entries, ([k, v]) => [k, JSON.parse(JSON.stringify(v))] as [K, V]);
  const map = new Map<K, V>(snapshot.map(([k, v]) => [k, JSON.parse(JSON.stringify(v))])) as ResettableMap<K, V>;
  map.reset = () => {
    map.clear();
    for (const [k, v] of snapshot) map.set(k, JSON.parse(JSON.stringify(v)) as V);
  };
  return map;
}
