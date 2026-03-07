import { HttpResponse, delay, http } from 'msw';
import type { Group, MockCollection, Principal, ServiceAccount } from './db';
import { DEFAULT_GROUP_MEMBERS, DEFAULT_GROUP_SERVICE_ACCOUNTS } from './seed';

const MOCK_DELAY = 200;

type MapOrRecord<V> = Map<string, V> | Record<string, V>;

function toMap<V>(input: MapOrRecord<V>): Map<string, V> {
  return input instanceof Map ? input : new Map(Object.entries(input));
}

export interface GroupMembersHandlerOptions {
  networkDelay?: number;
  onListMembers?: (...args: unknown[]) => void;
  onAddMembers?: (...args: unknown[]) => void;
  onAddMembersWithRequest?: (request: Request, params: { groupId: string }) => void;
  onRemoveMembers?: (...args: unknown[]) => void;
  /** When provided, POST/DELETE sync the group's principalCount */
  groups?: MockCollection<Group>;
  /** When provided, POST looks up users by username to add full Principal objects */
  users?: MockCollection<Principal>;
}

export function createGroupMembersHandlers(
  members: MapOrRecord<Principal[]>,
  serviceAccounts: MapOrRecord<ServiceAccount[]> = new Map(),
  options: GroupMembersHandlerOptions = {},
) {
  const membersByGroupId = toMap(members);
  const serviceAccountsByGroupId = toMap(serviceAccounts);
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/rbac/v1/groups/:groupId/principals/', async ({ params, request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const groupId = params.groupId as string;
      const principalType = url.searchParams.get('principal_type') || url.searchParams.get('type');
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      const principalUsername = url.searchParams.get('principal_username') || '';
      const serviceAccountName = url.searchParams.get('service_account_name') || '';
      const serviceAccountDescription = url.searchParams.get('service_account_description') || '';
      const usernameFilter = principalUsername || serviceAccountName || serviceAccountDescription;

      if (principalType === 'service-account') {
        let accounts = serviceAccountsByGroupId.get(groupId) ?? [];
        if (principalUsername) {
          accounts = accounts.filter((sa) => sa.clientId.toLowerCase().includes(principalUsername.toLowerCase()));
        }
        if (serviceAccountName) {
          accounts = accounts.filter((sa) => (sa.name ?? '').toLowerCase().includes(serviceAccountName.toLowerCase()));
        }
        if (serviceAccountDescription) {
          accounts = accounts.filter((sa) => (sa.description ?? '').toLowerCase().includes(serviceAccountDescription.toLowerCase()));
        }
        const paginated = accounts.slice(offset, offset + limit);
        options.onListMembers?.(groupId, url.searchParams);
        return HttpResponse.json({
          data: paginated,
          meta: { count: accounts.length, limit, offset },
        });
      }

      // Handle unmodified default groups — return empty (real API shows special card)
      if (options.groups) {
        const group = options.groups.findFirst((q) => q.where({ uuid: groupId }));
        const isUnmodifiedDefault = (groupId === 'admin-default' || groupId === 'system-default') && group?.system !== false;
        if (isUnmodifiedDefault) {
          options.onListMembers?.(groupId, url.searchParams);
          return HttpResponse.json({ data: [], meta: { count: 0, limit, offset } });
        }
      }

      let members = membersByGroupId.get(groupId) ?? [];
      if (usernameFilter) {
        members = members.filter((m) => m.username.toLowerCase().includes(usernameFilter.toLowerCase()));
      }
      const paginated = members.slice(offset, offset + limit);

      options.onListMembers?.(groupId, url.searchParams);
      return HttpResponse.json({
        data: paginated,
        meta: { count: members.length, limit, offset },
      });
    }),

    http.post('*/api/rbac/v1/groups/:groupId/principals/', async ({ params, request }) => {
      await delay(networkDelay);
      const groupId = params.groupId as string;
      const body = (await request.json()) as { principals: Array<{ username: string }> };

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

      // Add members to the map
      const currentMembers = membersByGroupId.get(groupId) ?? [];
      const newMembers = [...currentMembers];
      for (const { username } of body.principals) {
        if (newMembers.some((m) => m.username === username)) continue;
        const fullUser = options.users?.findFirst((q) => q.where({ username }));
        newMembers.push(fullUser ?? { username, email: '', first_name: '', last_name: '', is_active: true, is_org_admin: false });
      }
      membersByGroupId.set(groupId, newMembers);

      // Sync group principalCount
      if (options.groups) {
        await options.groups.update((q) => q.where({ uuid: groupId }), {
          data(g) {
            g.principalCount = newMembers.length;
            g.modified = new Date().toISOString();
          },
        });
      }

      options.onAddMembers?.(groupId, body);
      options.onAddMembersWithRequest?.(request, { groupId });
      return HttpResponse.json({ data: body.principals, meta: { count: body.principals.length } });
    }),

    http.delete('*/api/rbac/v1/groups/:groupId/principals/', async ({ params, request }) => {
      await delay(networkDelay);
      const groupId = params.groupId as string;
      const url = new URL(request.url);
      const usernames = url.searchParams.get('usernames')?.split(',') || [];

      // Remove members from the map
      const currentMembers = membersByGroupId.get(groupId) ?? [];
      const remaining = currentMembers.filter((m) => !usernames.includes(m.username));
      membersByGroupId.set(groupId, remaining);

      // Sync group principalCount
      if (options.groups) {
        await options.groups.update((q) => q.where({ uuid: groupId }), {
          data(g) {
            g.principalCount = remaining.length;
            g.modified = new Date().toISOString();
          },
        });
      }

      options.onRemoveMembers?.(groupId, usernames);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

/** Convenience wrapper with default data — creates internal Maps for component stories */
export function groupMembersHandlers(
  members?: Record<string, Principal[]>,
  serviceAccounts?: Record<string, ServiceAccount[]>,
  options?: GroupMembersHandlerOptions,
) {
  return createGroupMembersHandlers(
    new Map(Object.entries(members ?? DEFAULT_GROUP_MEMBERS)),
    new Map(Object.entries(serviceAccounts ?? DEFAULT_GROUP_SERVICE_ACCOUNTS)),
    options,
  );
}

/** All group-member endpoints return the given error status */
export function groupMembersErrorHandlers(status: number = 500) {
  const body = { error: 'Error' };
  return [
    http.get('*/api/rbac/v1/groups/:groupId/principals/', () => HttpResponse.json(body, { status })),
    http.post('*/api/rbac/v1/groups/:groupId/principals/', () => HttpResponse.json(body, { status })),
    http.delete('*/api/rbac/v1/groups/:groupId/principals/', () => HttpResponse.json(body, { status })),
  ];
}

/** All group-member endpoints delay forever (loading state) */
export function groupMembersLoadingHandlers() {
  const handler = async () => {
    await delay('infinite');
    return new HttpResponse(null);
  };
  return [
    http.get('*/api/rbac/v1/groups/:groupId/principals/', handler),
    http.post('*/api/rbac/v1/groups/:groupId/principals/', handler),
    http.delete('*/api/rbac/v1/groups/:groupId/principals/', handler),
  ];
}
