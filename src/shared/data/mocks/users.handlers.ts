import { HttpResponse, delay, http } from 'msw';
import type { MockCollection, Principal } from './db';
import { createSeededCollection, paginate } from './db';
import { DEFAULT_USERS } from './seed';

const MOCK_DELAY = 200;

export interface UsersHandlerOptions {
  networkDelay?: number;
  onList?: (params: URLSearchParams) => void;
  onChangeStatus?: (body: { users: Array<{ username: string; is_active: boolean }> }) => void;
}

export function createUsersHandlers(collection: MockCollection<Principal>, options: UsersHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/rbac/v1/principals/', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      const usernameFilter = url.searchParams.get('usernames');
      const statusFilter = url.searchParams.get('status');

      let users = collection.all();

      if (usernameFilter) {
        users = users.filter((u) => u.username.toLowerCase().includes(usernameFilter.toLowerCase()));
      }

      const emailFilter = url.searchParams.get('email');
      if (emailFilter) {
        users = users.filter((u) => (u.email || '').toLowerCase().includes(emailFilter.toLowerCase()));
      }

      if (statusFilter === 'enabled') {
        users = users.filter((u) => u.is_active ?? true);
      } else if (statusFilter === 'disabled') {
        users = users.filter((u) => !(u.is_active ?? true));
      }

      const sortOrder = url.searchParams.get('sort_order') || 'asc';
      users = [...users].sort((a, b) => {
        const comparison = a.username.localeCompare(b.username);
        return sortOrder === 'desc' ? -comparison : comparison;
      });

      options.onList?.(url.searchParams);
      return HttpResponse.json(paginate(users, offset, limit));
    }),

    http.put('*/api/rbac/v1/users/:userId/', async () => {
      await delay(networkDelay);
      return HttpResponse.json({ success: true });
    }),

    http.put('/change-users-status', async ({ request }) => {
      await delay(networkDelay);
      const body = (await request.json()) as { users: Array<{ username: string; is_active: boolean }> };

      options.onChangeStatus?.(body);

      for (const { username, is_active } of body.users) {
        await collection.update((q) => q.where({ username }), {
          data(u) {
            u.is_active = is_active;
          },
        });
      }

      return HttpResponse.json({ message: 'Users status updated successfully' });
    }),
  ];
}

/** Convenience wrapper — creates a collection internally */
export function usersHandlers(data?: Principal[], options?: UsersHandlerOptions) {
  return createUsersHandlers(createSeededCollection(data ?? DEFAULT_USERS), options);
}

/** All users endpoints return the given error status */
export function usersErrorHandlers(status: number = 500) {
  const body = { error: 'Error' };
  return [
    http.get('*/api/rbac/v1/principals/', () => HttpResponse.json(body, { status })),
    http.put('*/api/rbac/v1/users/:userId/', () => HttpResponse.json(body, { status })),
  ];
}

/** All users endpoints delay forever (loading state) */
export function usersLoadingHandlers() {
  const handler = async () => {
    await delay('infinite');
    return new HttpResponse(null);
  };
  return [http.get('*/api/rbac/v1/principals/', handler), http.put('*/api/rbac/v1/users/:userId/', handler)];
}
