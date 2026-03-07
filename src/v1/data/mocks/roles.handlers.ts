import { HttpResponse, delay, http } from 'msw';
import type { MockCollection, RoleOutDynamic } from './db';
import { createSeededCollection, paginate } from './db';
import { DEFAULT_V1_ROLES } from './seed';

const MOCK_DELAY = 200;

export interface V1RolesHandlerOptions {
  networkDelay?: number;
  onList?: (params: URLSearchParams) => void;
  /** Called when GET single role is requested */
  onGet?: (roleId: string) => void;
  /** Called when GET role access is requested */
  onAccess?: (url: string) => void;
  onCreate?: (...args: unknown[]) => void;
  onUpdate?: (...args: unknown[]) => void;
  onDelete?: (...args: unknown[]) => void;
  /** When true, return all roles even when username filter is present (default: slice to 2) */
  returnAllForUsername?: boolean;
}

export function createV1RolesHandlers(collection: MockCollection<RoleOutDynamic>, options: V1RolesHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/rbac/v1/roles/', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
      const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
      const nameFilter = url.searchParams.get('name') ?? url.searchParams.get('display_name') ?? url.searchParams.get('displayName');
      const nameMatch = url.searchParams.get('name_match') ?? url.searchParams.get('nameMatch');
      const username = url.searchParams.get('username');
      const systemFilter = url.searchParams.get('system');
      const applicationFilter = url.searchParams.get('application');
      const orderBy = url.searchParams.get('order_by');
      const forceEmpty = url.searchParams.get('force_empty') === 'true';

      if (forceEmpty) {
        options.onList?.(url.searchParams);
        return HttpResponse.json({ data: [], meta: { count: 0, limit, offset } });
      }

      let roles = collection.all();

      if (nameFilter) {
        const isExact = String(nameMatch).toLowerCase() === 'exact';
        roles = roles.filter((r) => {
          const name = (r.name ?? '').toLowerCase();
          const displayName = (r.display_name ?? '').toLowerCase();
          const filter = nameFilter.toLowerCase();
          return isExact ? name === filter || displayName === filter : name.includes(filter) || displayName.includes(filter);
        });
      }

      if (systemFilter === 'true') {
        roles = roles.filter((r) => r.system);
      } else if (systemFilter === 'false') {
        roles = roles.filter((r) => !r.system);
      }

      if (applicationFilter) {
        const filterApps = applicationFilter.split(',').map((a) => a.trim().toLowerCase());
        roles = roles.filter((r) => r.applications.some((app) => filterApps.includes(app.toLowerCase())));
      }

      if (username && !options.returnAllForUsername) {
        roles = roles.slice(0, 2);
      }

      if (orderBy) {
        const desc = orderBy.startsWith('-');
        const field = (desc ? orderBy.slice(1) : orderBy) as keyof RoleOutDynamic;
        roles = [...roles].sort((a, b) => {
          const aVal = String(a[field] ?? a.name);
          const bVal = String(b[field] ?? b.name);
          return desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        });
      }

      options.onList?.(url.searchParams);
      return HttpResponse.json(paginate(roles, offset, limit));
    }),

    http.get('*/api/rbac/v1/roles/:id/', async ({ params }) => {
      await delay(networkDelay);
      const roleId = params.id as string;
      options.onGet?.(roleId);
      const role = collection.findFirst((q) => q.where({ uuid: roleId }));
      if (!role) {
        return new HttpResponse(null, { status: 404 });
      }
      return HttpResponse.json(role);
    }),

    http.post('*/api/rbac/v1/roles/', async ({ request }) => {
      await delay(networkDelay);
      const body = (await request.json()) as { name: string; display_name?: string; description?: string };
      const newRole: RoleOutDynamic = {
        uuid: `role-${Date.now()}`,
        name: body.name,
        display_name: body.display_name ?? body.name,
        description: body.description ?? '',
        system: false,
        platform_default: false,
        admin_default: false,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        policyCount: 1,
        accessCount: 0,
        applications: [],
      };
      await collection.create(newRole);
      options.onCreate?.(body);
      return HttpResponse.json(newRole, { status: 201 });
    }),

    http.put('*/api/rbac/v1/roles/:id/', async ({ params, request }) => {
      await delay(networkDelay);
      const body = (await request.json()) as Partial<RoleOutDynamic>;
      const updated = await collection.update((q) => q.where({ uuid: params.id as string }), {
        data(r) {
          if (body.name !== undefined) r.name = body.name;
          if (body.display_name !== undefined) r.display_name = body.display_name;
          if (body.description !== undefined) r.description = body.description;
          if (body.access !== undefined) {
            r.access = body.access;
            r.accessCount = body.access.length;
          }
          r.modified = new Date().toISOString();
        },
      });
      if (!updated) {
        return new HttpResponse(null, { status: 404 });
      }
      options.onUpdate?.(params.id, body);
      return HttpResponse.json(updated);
    }),

    http.delete('*/api/rbac/v1/roles/:id/', async ({ params }) => {
      await delay(networkDelay);
      const deleted = collection.delete((q) => q.where({ uuid: params.id as string }));
      if (!deleted) {
        return new HttpResponse(null, { status: 404 });
      }
      options.onDelete?.(params.id);
      return new HttpResponse(null, { status: 204 });
    }),

    http.patch('*/api/rbac/v1/roles/:id', async ({ params, request }) => {
      await delay(networkDelay);
      const body = (await request.json()) as Partial<RoleOutDynamic>;
      const updated = await collection.update((q) => q.where({ uuid: params.id as string }), {
        data(r) {
          const { modified: _, ...updates } = body;
          Object.assign(r, updates);
          r.modified = new Date().toISOString();
        },
      });
      if (!updated) {
        return new HttpResponse(null, { status: 404 });
      }
      options.onUpdate?.(params.id, body);
      return HttpResponse.json(updated);
    }),

    http.get('*/api/rbac/v1/roles/:id/access/', async ({ params, request }) => {
      await delay(networkDelay);
      options.onAccess?.(request.url);
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
      const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
      const role = collection.findFirst((q) => q.where({ uuid: params.id as string }));
      const access = role?.access ?? [];
      return HttpResponse.json(paginate(access, offset, limit));
    }),
  ];
}

/** Convenience wrapper — creates a Collection internally */
export function v1RolesHandlers(data?: RoleOutDynamic[], options?: V1RolesHandlerOptions) {
  return createV1RolesHandlers(createSeededCollection(data ?? DEFAULT_V1_ROLES), options);
}

/** All V1 roles endpoints return the given error status */
export function v1RolesErrorHandlers(status: number = 500) {
  const body = { error: 'Error' };
  return [
    http.get('*/api/rbac/v1/roles/', () => HttpResponse.json(body, { status })),
    http.get('*/api/rbac/v1/roles/:id/', () => HttpResponse.json(body, { status })),
    http.post('*/api/rbac/v1/roles/', () => HttpResponse.json(body, { status })),
    http.put('*/api/rbac/v1/roles/:id/', () => HttpResponse.json(body, { status })),
    http.patch('*/api/rbac/v1/roles/:id', () => HttpResponse.json(body, { status })),
    http.delete('*/api/rbac/v1/roles/:id/', () => HttpResponse.json(body, { status })),
    http.get('*/api/rbac/v1/roles/:id/access/', () => HttpResponse.json(body, { status })),
  ];
}

/** All V1 roles endpoints delay forever (loading state) */
export function v1RolesLoadingHandlers() {
  const handler = async () => {
    await delay('infinite');
    return new HttpResponse(null);
  };
  return [
    http.get('*/api/rbac/v1/roles/', handler),
    http.get('*/api/rbac/v1/roles/:id/', handler),
    http.post('*/api/rbac/v1/roles/', handler),
    http.put('*/api/rbac/v1/roles/:id/', handler),
    http.patch('*/api/rbac/v1/roles/:id', handler),
    http.delete('*/api/rbac/v1/roles/:id/', handler),
    http.get('*/api/rbac/v1/roles/:id/access/', handler),
  ];
}
