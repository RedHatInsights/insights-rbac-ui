import { HttpResponse, delay, http } from 'msw';
import type { RolesBatchDeleteRolesRequest, RolesCreateOrUpdateRoleRequest, RolesList200Response } from '../api/roles';
import type { MockCollection, Role } from './db';
import { createSeededCollection } from './db';
import { DEFAULT_V2_ROLES } from './seed';

const MOCK_DELAY = 200;

export interface V2RolesHandlerOptions {
  /** Network delay in ms (default: 200) */
  networkDelay?: number;
  /** Spy function called on list requests */
  onList?: (...args: unknown[]) => void;
  /** When provided, overrides roles returned for username-filtered requests */
  rolesForUsername?: (username: string) => Role[] | null;
  /** When provided, overrides roles returned for resource-type-filtered requests */
  rolesForResource?: (resourceType: string, resourceId: string) => Role[] | null;
  /** Spy function called on read requests */
  onRead?: (...args: unknown[]) => void;
  /** Spy function called on create requests */
  onCreate?: (...args: unknown[]) => void;
  /** Spy function called on update requests */
  onUpdate?: (...args: unknown[]) => void;
  /** Spy function called on delete requests */
  onDelete?: (...args: unknown[]) => void;
  /** Spy function called on batch delete requests */
  onBatchDelete?: (...args: unknown[]) => void;
}

/**
 * Create MSW handlers for V2 Roles API.
 *
 * Response types match @redhat-cloud-services/rbac-client V2 types exactly.
 * When rbac-client updates, TypeScript catches shape drift at build time.
 */
export function createV2RolesHandlers(collection: MockCollection<Role>, options: V2RolesHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/rbac/v2/roles/', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const limitParam = url.searchParams.get('limit');
      const limit = limitParam === '-1' ? 9999 : parseInt(limitParam || '20', 10);
      const cursorParam = url.searchParams.get('cursor');
      const nameFilter = url.searchParams.get('name');
      const orderBy = url.searchParams.get('order_by') || '';
      const usernameFilter = url.searchParams.get('username');
      const resourceTypeFilter = url.searchParams.get('resource_type');
      const resourceIdFilter = url.searchParams.get('resource_id');

      let roles = collection.all();

      if (resourceTypeFilter && options.rolesForResource) {
        const resourceRoles = options.rolesForResource(resourceTypeFilter, resourceIdFilter ?? '');
        if (resourceRoles !== null) {
          const allowedIds = new Set(resourceRoles.map((r) => r.id));
          roles = roles.filter((r) => allowedIds.has(r.id));
        }
      }

      if (usernameFilter && options.rolesForUsername) {
        const customRoles = options.rolesForUsername(usernameFilter);
        if (customRoles !== null) {
          const listRoles: Role[] = customRoles.map(({ permissions: _perms, ...role }) => ({
            ...role,
            permissions_count: role.permissions_count ?? _perms?.length ?? 0,
          }));
          const startIndex = cursorParam ? Math.max(0, parseInt(atob(cursorParam), 10) || 0) : 0;
          const paginatedRoles = listRoles.slice(startIndex, startIndex + limit);
          const nextIndex = startIndex + limit;
          const hasNext = nextIndex < listRoles.length;
          const basePath = url.origin + url.pathname;
          return HttpResponse.json({
            meta: { limit },
            links: {
              next: hasNext ? `${basePath}?limit=${limit}&cursor=${btoa(String(nextIndex))}` : null,
              previous: startIndex > 0 ? `${basePath}?limit=${limit}&cursor=${btoa(String(Math.max(0, startIndex - limit)))}` : null,
            },
            data: paginatedRoles,
          });
        }
      }

      if (nameFilter) {
        const term = nameFilter.replace(/\*/g, '').toLowerCase();
        if (term) {
          roles = roles.filter((r) => r.name?.toLowerCase().includes(term));
        }
      }

      if (orderBy) {
        const desc = orderBy.startsWith('-');
        const field = orderBy.replace(/^-/, '') as keyof Role;
        roles = [...roles].sort((a, b) => {
          const aVal = String(a[field] ?? '');
          const bVal = String(b[field] ?? '');
          return desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        });
      }

      const startIndex = cursorParam ? Math.max(0, parseInt(atob(cursorParam), 10) || 0) : 0;
      const paginatedRoles = roles.slice(startIndex, startIndex + limit);
      const nextIndex = startIndex + limit;
      const hasNext = nextIndex < roles.length;

      const listRoles: Role[] = paginatedRoles.map(({ permissions: _perms, ...role }) => ({
        ...role,
        permissions_count: role.permissions_count ?? _perms?.length ?? 0,
      }));

      const basePath = url.origin + url.pathname;
      const response: RolesList200Response = {
        meta: { limit },
        links: {
          next: hasNext ? `${basePath}?limit=${limit}&cursor=${btoa(String(nextIndex))}` : null,
          previous: startIndex > 0 ? `${basePath}?limit=${limit}&cursor=${btoa(String(Math.max(0, startIndex - limit)))}` : null,
        },
        data: listRoles,
      };

      options.onList?.(url.searchParams);
      return HttpResponse.json(response);
    }),

    http.get('*/api/rbac/v2/roles/:id/', async ({ params }) => {
      await delay(networkDelay);
      const role = collection.findFirst((q) => q.where({ id: params.id as string }));
      if (!role) {
        return new HttpResponse(null, { status: 404 });
      }
      options.onRead?.(params.id);
      return HttpResponse.json(role);
    }),

    http.post('*/api/rbac/v2/roles/', async ({ request }) => {
      await delay(networkDelay);
      const body = (await request.json()) as RolesCreateOrUpdateRoleRequest;
      const newRole: Role = {
        id: `role-${Date.now()}`,
        name: body.name,
        description: body.description,
        permissions: body.permissions,
        permissions_count: body.permissions.length,
        last_modified: new Date().toISOString(),
        org_id: '12510751',
      };
      await collection.create(newRole);
      options.onCreate?.(body);
      return HttpResponse.json(newRole, { status: 201 });
    }),

    http.put('*/api/rbac/v2/roles/:id/', async ({ params, request }) => {
      await delay(networkDelay);
      const roleId = params.id as string;
      const body = (await request.json()) as RolesCreateOrUpdateRoleRequest;

      const updated = await collection.update((q) => q.where({ id: roleId }), {
        data(r) {
          if (body.name !== undefined) r.name = body.name;
          if (body.description !== undefined) r.description = body.description;
          if (body.permissions !== undefined) {
            r.permissions = body.permissions;
            r.permissions_count = body.permissions.length;
          }
          r.last_modified = new Date().toISOString();
        },
      });

      if (!updated) {
        return new HttpResponse(null, { status: 404 });
      }

      options.onUpdate?.(roleId, body);
      return HttpResponse.json(updated);
    }),

    http.delete('*/api/rbac/v2/roles/:id/', async ({ params }) => {
      await delay(networkDelay);
      const deleted = collection.delete((q) => q.where({ id: params.id as string }));
      if (!deleted) {
        return new HttpResponse(null, { status: 404 });
      }
      options.onDelete?.(params.id);
      return new HttpResponse(null, { status: 204 });
    }),

    http.post('*/api/rbac/v2/roles:batchDelete', async ({ request }) => {
      await delay(networkDelay);
      const body = (await request.json()) as RolesBatchDeleteRolesRequest;
      for (const id of body.ids) {
        collection.delete((q) => q.where({ id }));
      }
      options.onBatchDelete?.(body.ids);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

/** Convenience wrapper — creates a Collection internally */
export function v2RolesHandlers(data?: Role[], options?: V2RolesHandlerOptions) {
  return createV2RolesHandlers(createSeededCollection(data ?? DEFAULT_V2_ROLES), options);
}

/** All V2 roles endpoints return the given error status */
export function v2RolesErrorHandlers(status: number = 500) {
  const body = { error: 'Error' };
  return [
    http.get('*/api/rbac/v2/roles/', () => HttpResponse.json(body, { status })),
    http.get('*/api/rbac/v2/roles/:id/', () => HttpResponse.json(body, { status })),
    http.post('*/api/rbac/v2/roles/', () => HttpResponse.json(body, { status })),
    http.put('*/api/rbac/v2/roles/:id/', () => HttpResponse.json(body, { status })),
    http.delete('*/api/rbac/v2/roles/:id/', () => HttpResponse.json(body, { status })),
    http.post('*/api/rbac/v2/roles:batchDelete', () => HttpResponse.json(body, { status })),
  ];
}

/** All V2 roles endpoints delay forever (loading state) */
export function v2RolesLoadingHandlers() {
  const handler = async () => {
    await delay('infinite');
    return new HttpResponse(null);
  };
  return [
    http.get('*/api/rbac/v2/roles/', handler),
    http.get('*/api/rbac/v2/roles/:id/', handler),
    http.post('*/api/rbac/v2/roles/', handler),
    http.put('*/api/rbac/v2/roles/:id/', handler),
    http.delete('*/api/rbac/v2/roles/:id/', handler),
    http.post('*/api/rbac/v2/roles:batchDelete', handler),
  ];
}
