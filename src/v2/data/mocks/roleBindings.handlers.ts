import { HttpResponse, delay, http } from 'msw';
import type {
  RoleBindingsGroupSubject,
  RoleBindingsList200Response,
  RoleBindingsListBySubject200Response,
  RoleBindingsRoleBinding,
} from '../api/workspaces';
import type { RoleBinding } from '../queries/roleBindings';
import { DEFAULT_ROLE_BINDINGS } from './seed';

const MOCK_DELAY = 200;
const VALID_EXCLUDE_SOURCES = new Set(['direct', 'indirect']);

function parseExcludeSources(url: URL): { value?: string; error?: ReturnType<typeof HttpResponse.json> } {
  const raw = url.searchParams.get('exclude_sources');
  if (!raw) return {};
  if (VALID_EXCLUDE_SOURCES.has(raw)) return { value: raw };
  return { error: HttpResponse.json({ error: `Invalid exclude_sources: '${raw}'. Expected 'direct' | 'indirect'.` }, { status: 400 }) };
}

/** Returns custom response for by-subject endpoint. Use for OrganizationManagement etc. */
export function roleBindingsBySubjectResponseHandlers(response: RoleBindingsListBySubject200Response) {
  return [
    http.get('*/api/rbac/v2/role-bindings/by-subject/', () => HttpResponse.json(response)),
    http.get('*/api/rbac/v2/role-bindings/by-subject', () => HttpResponse.json(response)),
  ];
}

/** Returns dynamic response based on request params (e.g. exclude_sources). */
export function roleBindingsBySubjectDynamicHandlers(
  getResponse: (params: { resourceId?: string; excludeSources?: string }) => RoleBindingsListBySubject200Response,
) {
  const handler = ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const { value: excludeSources, error } = parseExcludeSources(url);
    if (error) return error;
    const resourceId = url.searchParams.get('resource_id') || url.searchParams.get('resourceId') || undefined;
    return HttpResponse.json(getResponse({ resourceId, excludeSources }));
  };
  return [http.get('*/api/rbac/v2/role-bindings/by-subject/', handler), http.get('*/api/rbac/v2/role-bindings/by-subject', handler)];
}

export interface RoleBindingsHandlerOptions {
  networkDelay?: number;
  onList?: (...args: unknown[]) => void;
  onUpdate?: (...args: unknown[]) => void;
}

function toApiBinding(b: RoleBinding): RoleBindingsRoleBinding {
  return {
    role: { id: b.role.id, name: b.role.name },
    subject: {
      id: b.subject.id,
      type: b.subject.type,
      ...(b.subject.groupName && { group: { name: b.subject.groupName } }),
    } as RoleBindingsGroupSubject,
    resource: { id: b.resource.id, name: b.resource.name, type: b.resource.type },
  };
}

export function createRoleBindingsHandlers(bindings: RoleBinding[], options: RoleBindingsHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/rbac/v2/role-bindings/by-subject', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const { value: excludeSources, error } = parseExcludeSources(url);
      if (error) return error;
      const resourceId = url.searchParams.get('resource_id');

      let filtered = bindings;

      if (resourceId) {
        filtered = filtered.filter((b) => b.resource.id === resourceId);
      }
      if (excludeSources === 'direct') {
        filtered = [];
      }

      options.onList?.(url.searchParams);
      return HttpResponse.json({
        data: filtered.map(toApiBinding),
        meta: { count: filtered.length },
      });
    }),
  ];
}

/** Convenience wrapper with default data */
export function roleBindingsHandlers(data?: RoleBinding[], options?: RoleBindingsHandlerOptions) {
  const bindings = data ?? DEFAULT_ROLE_BINDINGS;
  return [
    ...createRoleBindingsHandlers(bindings, options),
    ...createRoleBindingsListHandlers(bindings, options),
    ...roleBindingsUpdateHandlers(options),
  ];
}

/**
 * Handler for PUT /api/rbac/v2/role-bindings/by-subject/ (update endpoint).
 * Used by useUpdateGroupRolesMutation to replace all roles for a group on a resource.
 */
export function roleBindingsUpdateHandlers(options: Pick<RoleBindingsHandlerOptions, 'networkDelay' | 'onUpdate'> = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.put('*/api/rbac/v2/role-bindings/by-subject/', async ({ request }) => {
      await delay(networkDelay);
      const body = await request.json();
      options.onUpdate?.(body);
      return HttpResponse.json({ data: body });
    }),
    http.put('*/api/rbac/v2/role-bindings/by-subject', async ({ request }) => {
      await delay(networkDelay);
      const body = await request.json();
      options.onUpdate?.(body);
      return HttpResponse.json({ data: body });
    }),
  ];
}

/**
 * Handler for GET /api/rbac/v2/role-bindings/ (base list endpoint).
 * Used by useRoleUsageQuery and useGroup/UserRoleBindingsQuery.
 */
export function createRoleBindingsListHandlers(bindings: RoleBinding[], options: RoleBindingsHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/rbac/v2/role-bindings/', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const roleId = url.searchParams.get('role_id');
      const subjectType = url.searchParams.get('subject_type');
      const subjectId = url.searchParams.get('subject_id');
      const grantedSubjectType = url.searchParams.get('granted_subject_type');
      const grantedSubjectId = url.searchParams.get('granted_subject_id');
      const resourceId = url.searchParams.get('resource_id');
      const limit = parseInt(url.searchParams.get('limit') || '1000', 10);

      let filtered = bindings;

      if (roleId) {
        filtered = filtered.filter((b) => b.role.id === roleId);
      }
      if (subjectType) {
        filtered = filtered.filter((b) => b.subject.type === subjectType);
      }
      if (subjectId) {
        filtered = filtered.filter((b) => b.subject.id === subjectId);
      }
      if (grantedSubjectType) {
        filtered = filtered.filter((b) => b.subject.type === grantedSubjectType);
      }
      if (grantedSubjectId) {
        filtered = filtered.filter((b) => b.subject.id === grantedSubjectId);
      }
      if (resourceId) {
        filtered = filtered.filter((b) => b.resource.id === resourceId);
      }

      options.onList?.(url.searchParams);
      return HttpResponse.json({
        data: filtered.map(toApiBinding),
        meta: { count: filtered.length, limit },
        links: { next: null, previous: null },
      });
    }),
  ];
}

// ---------------------------------------------------------------------------
// Stateful role bindings (for journey stories with CRUD)
// ---------------------------------------------------------------------------

import type { RoleBindingsRoleBindingBySubject } from '../api/workspaces';
import type { WorkspaceGroupBinding } from '../queries/groupAssignments';
import type { Group, MockCollection } from '../../../shared/data/mocks/db';

export interface StatefulRoleBindingsOptions {
  networkDelay?: number;
  onList?: (...args: unknown[]) => void;
  onUpdate?: (params: { resourceId: string | null; subjectId: string | null; body: unknown }) => void;
  onBatchCreate?: (body: unknown) => void;
  /** Used by batchCreate to enrich subject with group name/description */
  groups?: MockCollection<Group>;
  /** Workspace list for resolving inherited bindings via ancestor traversal */
  workspaces?: Array<{ id: string; name?: string; parent_id?: string | null }>;
}

/**
 * Stateful role bindings handlers backed by a Map<workspaceId, RoleBindingBySubject[]>.
 * Mutations persist across requests within a story.
 */
export function createStatefulRoleBindingsHandlers(
  bindingsMap: Map<string, RoleBindingsRoleBindingBySubject[]>,
  options: StatefulRoleBindingsOptions = {},
) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    // GET /role-bindings/ — list by role_id (RoleBindingsList API format: RoleBindingsRoleBinding[])
    http.get('*/api/rbac/v2/role-bindings/', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const roleId = url.searchParams.get('role_id');
      const limit = parseInt(url.searchParams.get('limit') || '1000', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);

      const allBindings: RoleBindingsRoleBinding[] = [];
      const seenSubjects = new Set<string>();
      bindingsMap.forEach((bindings, workspaceId) => {
        for (const binding of bindings) {
          const roles = binding.roles || [];
          const matchingRole = roleId ? roles.find((r) => r.id === roleId) : roles[0];
          if (!matchingRole && roleId) continue;
          if (matchingRole) {
            const subjectId = binding.subject?.id;
            if (subjectId && seenSubjects.has(subjectId)) continue;
            if (subjectId) seenSubjects.add(subjectId);
            const groupName =
              (binding.subject as RoleBindingsGroupSubject | undefined)?.group?.name ??
              options.groups?.findFirst((q) => q.where({ uuid: subjectId }))?.name;
            const resource = binding.resource ?? { id: workspaceId, type: 'workspace' };
            const resourceName = (resource as { workspace?: { name: string } })?.workspace?.name ?? resource.id;
            allBindings.push({
              role: {
                id: matchingRole.id ?? roleId ?? '',
                name: matchingRole.name ?? matchingRole.id ?? roleId ?? '',
              },
              subject: {
                id: subjectId,
                type: binding.subject?.type ?? 'group',
                ...(groupName && { group: { name: groupName } }),
              } as RoleBindingsGroupSubject,
              resource: { ...resource, name: resourceName },
            });
          }
        }
      });

      const paginated = allBindings.slice(offset, offset + limit);
      options.onList?.(url.searchParams);
      const response: RoleBindingsList200Response = {
        data: paginated,
        meta: { limit },
        links: { next: null, previous: null },
      };
      return HttpResponse.json(response);
    }),

    // GET /role-bindings/by-subject/ — list by workspace (resource_id)
    ...(['*/api/rbac/v2/role-bindings/by-subject/', '*/api/rbac/v2/role-bindings/by-subject'] as const).map((pattern) =>
      http.get(pattern, async ({ request }) => {
        await delay(networkDelay);
        const url = new URL(request.url);
        const { value: excludeSources, error } = parseExcludeSources(url);
        if (error) return error;
        const resourceId = url.searchParams.get('resource_id') || url.searchParams.get('resourceId');
        const limit = parseInt(url.searchParams.get('limit') || '10000', 10);
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);

        if (!resourceId) {
          return HttpResponse.json({ data: [], meta: { count: 0, limit, offset } });
        }

        const directBindings = bindingsMap.get(resourceId) || [];
        let inheritedBindings: RoleBindingsRoleBindingBySubject[] = [];
        if (options.workspaces) {
          const getParentChain = (wsId: string): string[] => {
            const ws = options.workspaces!.find((w) => w.id === wsId);
            if (!ws?.parent_id) return [];
            return [ws.parent_id, ...getParentChain(ws.parent_id)];
          };
          inheritedBindings = getParentChain(resourceId).flatMap((parentId) =>
            (bindingsMap.get(parentId) || []).map((b) => ({
              ...b,
              sources: [{ id: parentId, name: options.workspaces!.find((w) => w.id === parentId)?.name ?? parentId, type: 'workspace' }],
            })),
          );
        }

        let bindings: RoleBindingsRoleBindingBySubject[];
        if (excludeSources === 'direct') {
          bindings = inheritedBindings;
        } else if (excludeSources === 'indirect') {
          bindings = directBindings;
        } else {
          bindings = [...directBindings, ...inheritedBindings];
        }

        const paginated = bindings.slice(offset, offset + limit);
        options.onList?.(url.searchParams);
        return HttpResponse.json({
          data: paginated,
          meta: { count: bindings.length, limit, offset },
        });
      }),
    ),

    // PUT /role-bindings/by-subject/ — replace bindings for a subject on a resource
    ...(['*/api/rbac/v2/role-bindings/by-subject/', '*/api/rbac/v2/role-bindings/by-subject'] as const).map((pattern) =>
      http.put(pattern, async ({ request }) => {
        await delay(networkDelay);
        const url = new URL(request.url);
        const resourceId = url.searchParams.get('resource_id') || url.searchParams.get('resourceId');
        const subjectId = url.searchParams.get('subject_id') || url.searchParams.get('subjectId');
        const body = (await request.json()) as { roles?: Array<{ id: string }> };

        options.onUpdate?.({ resourceId, subjectId, body });

        if (resourceId && subjectId && body.roles) {
          const existing = bindingsMap.get(resourceId) || [];
          const others = existing.filter((b) => b.subject?.id !== subjectId);

          const existingSubject = existing.find((b) => b.subject?.id === subjectId)?.subject ?? { id: subjectId, type: 'group' };
          const updatedBinding: RoleBindingsRoleBindingBySubject = {
            last_modified: new Date().toISOString(),
            subject: existingSubject,
            roles: body.roles.map((r) => ({ id: r.id, name: r.id })),
            resource: existing[0]?.resource ?? { id: resourceId, type: 'workspace' },
          };
          bindingsMap.set(resourceId, [...others, updatedBinding]);
        }

        return HttpResponse.json({ data: body });
      }),
    ),

    // POST /role-bindings:batchCreate — create bindings for group x role pairs
    http.post('*/api/rbac/v2/role-bindings:batchCreate', async ({ request }) => {
      await delay(networkDelay);
      const body = (await request.json()) as {
        requests?: Array<{
          resource?: { id: string; type: string };
          subject?: { id: string; type: string };
          role?: { id: string };
        }>;
      };

      options.onBatchCreate?.(body);

      if (body.requests) {
        for (const req of body.requests) {
          const resourceId = req.resource?.id;
          const subjectId = req.subject?.id;
          const roleId = req.role?.id;
          if (!resourceId || !subjectId || !roleId) continue;

          const existing = bindingsMap.get(resourceId) || [];
          const existingBinding = existing.find((b) => b.subject?.id === subjectId);

          if (existingBinding) {
            const existingRoles = existingBinding.roles || [];
            if (!existingRoles.some((r) => r.id === roleId)) {
              existingBinding.roles = [...existingRoles, { id: roleId, name: roleId }];
              existingBinding.last_modified = new Date().toISOString();
            }
          } else {
            const groupData = options.groups?.findFirst((q) => q.where({ uuid: subjectId }));
            const newBinding: WorkspaceGroupBinding = {
              last_modified: new Date().toISOString(),
              subject: {
                id: subjectId,
                type: 'group',
                ...(groupData && {
                  group: {
                    name: groupData.name,
                    description: groupData.description || '',
                    user_count: typeof groupData.principalCount === 'number' ? groupData.principalCount : 0,
                  },
                }),
              },
              roles: [{ id: roleId, name: roleId }],
              resource: { id: resourceId, type: 'workspace' },
            };
            existing.push(newBinding as RoleBindingsRoleBindingBySubject);
            bindingsMap.set(resourceId, existing);
          }
        }
      }

      return HttpResponse.json({ data: { created: body.requests?.length ?? 0 } });
    }),
  ];
}

/** All role-bindings endpoints return the given error status */
export function roleBindingsErrorHandlers(status: number = 500) {
  return [
    http.get('*/api/rbac/v2/role-bindings/by-subject', () => HttpResponse.json({ error: 'Error' }, { status })),
    http.get('*/api/rbac/v2/role-bindings/', () => HttpResponse.json({ error: 'Error' }, { status })),
  ];
}

/** All role-bindings endpoints delay forever (loading state) */
export function roleBindingsLoadingHandlers() {
  return [
    http.get('*/api/rbac/v2/role-bindings/by-subject', async () => {
      await delay('infinite');
      return new HttpResponse(null);
    }),
    http.get('*/api/rbac/v2/role-bindings/', async () => {
      await delay('infinite');
      return new HttpResponse(null);
    }),
  ];
}
