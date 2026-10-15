/**
 * Generic stateful collection for MSW handler factories.
 * Provides CRUD operations with reset capability for test isolation.
 */

export interface StatefulCollection<T> {
  /** Get all items */
  list(): T[];
  /** Get a single item by ID */
  get(id: string): T | undefined;
  /** Add a new item */
  create(item: T): T;
  /** Update an existing item by ID */
  update(id: string, patch: Partial<T>): T | undefined;
  /** Delete an item by ID */
  delete(id: string): boolean;
  /** Reset to initial state (for test isolation) */
  reset(): void;
}

/**
 * Create a stateful collection with CRUD operations.
 *
 * @param initialItems - Initial items in the collection
 * @param getId - Function to extract the ID from an item
 * @returns StatefulCollection with CRUD + reset
 */
export function createStatefulCollection<T>(initialItems: T[], getId: (item: T) => string): StatefulCollection<T> {
  // Deep copy initial items for reset
  const originalItems = JSON.parse(JSON.stringify(initialItems)) as T[];
  let items = JSON.parse(JSON.stringify(initialItems)) as T[];

  return {
    list: () => [...items],
    get: (id) => items.find((item) => getId(item) === id),
    create: (item) => {
      items.push(item);
      return item;
    },
    update: (id, patch) => {
      const index = items.findIndex((item) => getId(item) === id);
      if (index === -1) return undefined;
      items[index] = { ...items[index], ...patch };
      return items[index];
    },
    delete: (id) => {
      const index = items.findIndex((item) => getId(item) === id);
      if (index === -1) return false;
      items.splice(index, 1);
      return true;
    },
    reset: () => {
      items = JSON.parse(JSON.stringify(originalItems)) as T[];
    },
  };
}
