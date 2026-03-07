import { HttpResponse, delay, http } from 'msw';
import type { Group, MockCollection, RoleOut } from './db';
import { DEFAULT_GROUP_ROLES } from './seed';

const MOCK_DELAY = 200;

type MapOrRecord<V> = Map<string, V> | Record<string, V>;

function toMap<V>(input: MapOrRecord<V>): Map<string, V> {
  return input instanceof Map ? input : new Map(Object.entries(input));
}

export interface GroupRolesHandlerOptions {
  networkDelay?: number;
  onListRoles?: (...args: unknown[]) => void;
  onAddRoles?: (...args: unknown[]) => void;
  onRemoveRoles?: (...args: unknown[]) => void;
  /** When provided, POST/DELETE sync the group's roleCount */
  groups?: MockCollection<Group>;
  /** Full set of available roles for the `exclude=true` query */
  allRoles?: RoleOut[];
  /** Getter for roles — use when roles come from a Collection (evaluated at request time) */
  allRolesGetter?: () => RoleOut[];
}

export function createGroupRolesHandlers(roles: MapOrRecord<RoleOut[]>, options: GroupRolesHandlerOptions = {}) {
  const rolesByGroupId = toMap(roles);
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/rbac/v1/groups/:groupId/roles/', async ({ params, request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const groupId = params.groupId as string;
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      const nameFilter =
        url.searchParams.get('role_name') ||
        url.searchParams.get('role_display_name') ||
        url.searchParams.get('displayName') ||
        url.searchParams.get('name');
      const excluded = url.searchParams.get('exclude') === 'true' || url.searchParams.get('excluded') === 'true';

      let roles = rolesByGroupId.get(groupId) ?? [];

      if (excluded) {
        const assignedIds = new Set(roles.map((r) => r.uuid));
        const allRoles = options.allRolesGetter?.() ?? options.allRoles;
        if (allRoles) {
          roles = allRoles.filter((r) => !assignedIds.has(r.uuid));
        } else {
          const allRoles = Array.from(rolesByGroupId.values()).flat();
          const uniqueRoles = allRoles.filter((r, i, arr) => arr.findIndex((x) => x.uuid === r.uuid) === i);
          roles = uniqueRoles.filter((r) => !assignedIds.has(r.uuid));
        }
      }

      if (nameFilter) {
        roles = roles.filter(
          (r) =>
            (r.display_name ?? r.name).toLowerCase().includes(nameFilter.toLowerCase()) || r.name.toLowerCase().includes(nameFilter.toLowerCase()),
        );
      }

      const paginated = roles.slice(offset, offset + limit);

      options.onListRoles?.(groupId, url.searchParams);
      return HttpResponse.json({
        data: paginated,
        meta: { count: roles.length, limit, offset },
      });
    }),

    http.post('*/api/rbac/v1/groups/:groupId/roles/', async ({ params, request }) => {
      await delay(networkDelay);
      const groupId = params.groupId as string;
      const body = (await request.json()) as { roles: string[] };

      // Flip system-default group on first mutation
      if (options.groups) {
        const group = options.groups.findFirst((q) => q.where({ uuid: groupId }));
        if (group?.platform_default && group.system !== false) {
          await options.groups.update((q) => q.where({ uuid: groupId }), {
            data(g) {
              g.name = 'Custom default access';
              g.description = 'Modified default access group';
              g.system = false;
              g.modified = new Date().toISOString();
            },
          });
        }
      }

      // Add roles to the map
      const currentRoles = rolesByGroupId.get(groupId) ?? [];
      const newRoles = [...currentRoles];
      for (const roleUuid of body.roles) {
        if (newRoles.some((r) => r.uuid === roleUuid)) continue;
        // Try to find the full role from allRoles or from other groups
        const allRoles = options.allRolesGetter?.() ?? options.allRoles ?? [];
        const fullRole =
          allRoles.find((r) => r.uuid === roleUuid) ??
          Array.from(rolesByGroupId.values())
            .flat()
            .find((r) => r.uuid === roleUuid);
        if (fullRole) {
          newRoles.push({ ...fullRole });
        } else {
          newRoles.push({
            uuid: roleUuid,
            name: roleUuid,
            display_name: roleUuid,
            description: '',
            system: false,
            platform_default: false,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
          });
        }
      }
      rolesByGroupId.set(groupId, newRoles);

      // Sync group roleCount
      if (options.groups) {
        await options.groups.update((q) => q.where({ uuid: groupId }), {
          data(g) {
            g.roleCount = newRoles.length;
            g.modified = new Date().toISOString();
          },
        });
      }

      options.onAddRoles?.(groupId, body);
      return HttpResponse.json({ data: body.roles });
    }),

    http.delete('*/api/rbac/v1/groups/:groupId/roles/', async ({ params, request }) => {
      await delay(networkDelay);
      const groupId = params.groupId as string;
      const url = new URL(request.url);
      const roleIds = url.searchParams.get('roles')?.split(',') || [];

      // Remove roles from the map
      const currentRoles = rolesByGroupId.get(groupId) ?? [];
      const remaining = currentRoles.filter((r) => !roleIds.includes(r.uuid));
      rolesByGroupId.set(groupId, remaining);

      // Sync group roleCount
      if (options.groups) {
        await options.groups.update((q) => q.where({ uuid: groupId }), {
          data(g) {
            g.roleCount = remaining.length;
            g.modified = new Date().toISOString();
          },
        });
      }

      options.onRemoveRoles?.(groupId, roleIds);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

/** Convenience wrapper with default data — creates internal Maps for component stories */
export function groupRolesHandlers(roles?: Record<string, RoleOut[]>, options?: GroupRolesHandlerOptions) {
  return createGroupRolesHandlers(new Map(Object.entries(roles ?? DEFAULT_GROUP_ROLES)), options);
}

/** All group-roles endpoints return the given error status */
export function groupRolesErrorHandlers(status: number = 500) {
  const body = { error: 'Error' };
  return [
    http.get('*/api/rbac/v1/groups/:groupId/roles/', () => HttpResponse.json(body, { status })),
    http.post('*/api/rbac/v1/groups/:groupId/roles/', () => HttpResponse.json(body, { status })),
    http.delete('*/api/rbac/v1/groups/:groupId/roles/', () => HttpResponse.json(body, { status })),
  ];
}

/** All group-roles endpoints delay forever (loading state) */
export function groupRolesLoadingHandlers() {
  const handler = async () => {
    await delay('infinite');
    return new HttpResponse(null);
  };
  return [
    http.get('*/api/rbac/v1/groups/:groupId/roles/', handler),
    http.post('*/api/rbac/v1/groups/:groupId/roles/', handler),
    http.delete('*/api/rbac/v1/groups/:groupId/roles/', handler),
  ];
}
