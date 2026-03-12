import { HttpResponse, delay, http } from 'msw';
import type { Group, MockCollection } from './db';
import { createSeededCollection, paginate } from './db';
import { DEFAULT_GROUPS } from './seed';

const MOCK_DELAY = 200;

export interface GroupsHandlerOptions {
  networkDelay?: number;
  onList?: (params: URLSearchParams) => void;
  onAdminDefaultRequest?: () => void;
  onSystemRequest?: () => void;
  onCreate?: (...args: unknown[]) => void;
  onUpdate?: (...args: unknown[]) => void;
  onDelete?: (...args: unknown[]) => void;
  groupsForUsername?: (username: string) => Group[] | null;
  putReturnsError?: number;
  onAddServiceAccounts?: (...args: unknown[]) => void;
  postServiceAccountsReturnsError?: number;
  uuidForNewGroup?: string;
}

export function createGroupsHandlers(groups: MockCollection<Group>, options: GroupsHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  const listHandler = async ({ request }: { request: Request }) => {
    await delay(networkDelay);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const nameFilter = url.searchParams.get('name');
    const nameMatch = url.searchParams.get('name_match');
    const username = url.searchParams.get('username');
    const systemFilter = url.searchParams.get('system');
    const adminDefault = url.searchParams.get('admin_default');
    const platformDefault = url.searchParams.get('platform_default');
    const orderBy = url.searchParams.get('order_by');

    if (adminDefault === 'true') {
      options.onAdminDefaultRequest?.();
      const adminGroup = groups.findFirst((q) => q.where({ admin_default: true }));
      return HttpResponse.json({
        data: adminGroup ? [adminGroup] : [],
        meta: { count: adminGroup ? 1 : 0, limit, offset },
      });
    }

    if (platformDefault === 'true') {
      const platformGroup = groups.findFirst((q) => q.where({ platform_default: true }));
      return HttpResponse.json({
        data: platformGroup ? [platformGroup] : [],
        meta: { count: platformGroup ? 1 : 0, limit, offset },
      });
    }

    let filtered = groups.all();

    if (nameFilter) {
      filtered =
        nameMatch === 'exact'
          ? filtered.filter((g) => g.name.toLowerCase() === nameFilter.toLowerCase())
          : filtered.filter((g) => g.name.toLowerCase().includes(nameFilter.toLowerCase()));
    }

    if (username && options.groupsForUsername) {
      const customGroups = options.groupsForUsername(username);
      if (customGroups !== null) {
        return HttpResponse.json(paginate(customGroups, offset, limit));
      }
    }

    if (systemFilter === 'true') {
      options.onSystemRequest?.();
      filtered = filtered.filter((g) => g.system ?? false);
    } else if (systemFilter === 'false') {
      filtered = filtered.filter((g) => !(g.system ?? false));
    }

    // Apply sorting if order_by is specified
    if (orderBy) {
      const isDescending = orderBy.startsWith('-');
      const field = isDescending ? orderBy.slice(1) : orderBy;

      filtered = filtered.sort((a, b) => {
        const aVal = a[field as keyof Group] ?? '';
        const bVal = b[field as keyof Group] ?? '';
        const comparison = String(aVal).localeCompare(String(bVal));
        return isDescending ? -comparison : comparison;
      });
    }

    options.onList?.(url.searchParams);
    return HttpResponse.json(paginate(filtered, offset, limit));
  };

  return [
    http.get('*/api/rbac/v1/groups/', listHandler),
    http.get('*/api/rbac/v2/groups/', listHandler),

    http.get('*/api/rbac/v1/groups/:uuid/', async ({ params }) => {
      await delay(networkDelay);
      const group = groups.findFirst((q) => q.where({ uuid: params.uuid as string }));
      if (!group) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json(group);
    }),

    http.post('*/api/rbac/v1/groups/', async ({ request }) => {
      await delay(networkDelay);
      const body = (await request.json()) as { name: string; description?: string };
      const newGroup: Group = {
        uuid: options.uuidForNewGroup ?? `group-${Date.now()}`,
        name: body.name,
        description: body.description || '',
        principalCount: 0,
        roleCount: 0,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        platform_default: false,
        admin_default: false,
        system: false,
      };
      await groups.create(newGroup);
      options.onCreate?.(body);
      return HttpResponse.json(newGroup, { status: 201 });
    }),

    http.put('*/api/rbac/v1/groups/:uuid/', async ({ params, request }) => {
      await delay(networkDelay);
      if (options.putReturnsError) {
        return new HttpResponse(
          JSON.stringify({
            errors: [{ status: String(options.putReturnsError), detail: 'Internal server error occurred while updating group' }],
          }),
          { status: options.putReturnsError, headers: { 'Content-Type': 'application/json' } },
        );
      }
      const body = (await request.json()) as { name?: string; description?: string };
      const updated = await groups.update((q) => q.where({ uuid: params.uuid as string }), {
        data(g) {
          if (body.name !== undefined) g.name = body.name;
          if (body.description !== undefined) g.description = body.description;
          g.modified = new Date().toISOString();
        },
      });
      if (!updated) {
        return new HttpResponse(null, { status: 404 });
      }
      options.onUpdate?.(params.uuid, body);
      return HttpResponse.json(updated);
    }),

    http.delete('*/api/rbac/v1/groups/:uuid/', async ({ params }) => {
      await delay(networkDelay);
      const deleted = groups.delete((q) => q.where({ uuid: params.uuid as string }));
      if (!deleted) {
        return new HttpResponse(null, { status: 404 });
      }
      options.onDelete?.(params.uuid);
      return new HttpResponse(null, { status: 204 });
    }),

    http.post('*/api/rbac/v1/groups/:uuid/service-accounts/', async ({ params, request }) => {
      await delay(networkDelay);
      if (options.postServiceAccountsReturnsError) {
        return new HttpResponse(
          JSON.stringify({ errors: [{ detail: 'Service account assignment failed', status: String(options.postServiceAccountsReturnsError) }] }),
          { status: options.postServiceAccountsReturnsError, headers: { 'Content-Type': 'application/json' } },
        );
      }
      const body = (await request.json()) as { service_accounts?: Array<{ clientId: string }> };
      options.onAddServiceAccounts?.(params.uuid as string, body);
      return HttpResponse.json({ message: 'Service accounts assigned successfully' });
    }),

    http.post('*/api/rbac/v2/groups/:uuid/service-accounts/', async ({ request }) => {
      await delay(networkDelay);
      const body = (await request.json()) as { service_accounts: Array<{ clientId: string }> };
      return HttpResponse.json({
        data: body.service_accounts,
        meta: { count: body.service_accounts.length },
      });
    }),

    http.delete('*/api/rbac/v2/groups/:uuid/service-accounts/', async ({ request }) => {
      await delay(networkDelay);
      await request.json();
      return new HttpResponse(null, { status: 204 });
    }),

    http.get('*/api/rbac/v1/cross-account-requests/', async () => {
      await delay(networkDelay);
      return HttpResponse.json({ data: [], meta: { count: 0 } });
    }),
  ];
}

/** Convenience wrapper — creates a default-seeded collection internally */
export function groupsHandlers(data?: Group[], options?: GroupsHandlerOptions) {
  return createGroupsHandlers(createSeededCollection(data ?? DEFAULT_GROUPS), options);
}

/** All group endpoints return the given error status */
export function groupsErrorHandlers(status: number = 500) {
  const body = { error: 'Error' };
  return [
    http.get('*/api/rbac/v1/groups/', () => HttpResponse.json(body, { status })),
    http.get('*/api/rbac/v2/groups/', () => HttpResponse.json(body, { status })),
    http.get('*/api/rbac/v1/groups/:uuid/', () => HttpResponse.json(body, { status })),
    http.post('*/api/rbac/v1/groups/', () => HttpResponse.json(body, { status })),
    http.put('*/api/rbac/v1/groups/:uuid/', () => HttpResponse.json(body, { status })),
    http.delete('*/api/rbac/v1/groups/:uuid/', () => HttpResponse.json(body, { status })),
  ];
}

/** All group endpoints delay forever (loading state) */
export function groupsLoadingHandlers() {
  const handler = async () => {
    await delay('infinite');
    return new HttpResponse(null);
  };
  return [
    http.get('*/api/rbac/v1/groups/', handler),
    http.get('*/api/rbac/v2/groups/', handler),
    http.get('*/api/rbac/v1/groups/:uuid/', handler),
    http.get('*/api/rbac/v2/groups/:uuid/', handler),
    http.post('*/api/rbac/v1/groups/', handler),
    http.put('*/api/rbac/v1/groups/:uuid/', handler),
    http.delete('*/api/rbac/v1/groups/:uuid/', handler),
    http.post('*/api/rbac/v2/groups/:uuid/service-accounts/', handler),
    http.delete('*/api/rbac/v2/groups/:uuid/service-accounts/', handler),
  ];
}
