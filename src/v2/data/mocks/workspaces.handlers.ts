import { HttpResponse, delay, http } from 'msw';
import type { MockCollection, WorkspacesWorkspace } from './db';
import { createSeededCollection, paginate } from './db';
import { DEFAULT_WORKSPACES } from './seed';

const MOCK_DELAY = 200;

export interface WorkspacesHandlerOptions {
  networkDelay?: number;
  onList?: (...args: unknown[]) => void;
  onRead?: (...args: unknown[]) => void;
  onCreate?: (...args: unknown[]) => void;
  onUpdate?: (...args: unknown[]) => void;
  onDelete?: (...args: unknown[]) => void;
  onMove?: (...args: unknown[]) => void;
}

export function createWorkspacesHandlers(collection: MockCollection<WorkspacesWorkspace>, options: WorkspacesHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/rbac/v2/workspaces/', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '9999', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      const nameFilter = url.searchParams.get('name');
      const typeFilter = url.searchParams.get('type');
      const parentId = url.searchParams.get('parent_id');
      const orderBy = url.searchParams.get('order_by');

      let workspaces = collection.all();

      if (nameFilter) {
        workspaces = workspaces.filter((w) => w.name.toLowerCase().includes(nameFilter.toLowerCase()));
      }
      if (typeFilter && typeFilter !== 'all') {
        workspaces = workspaces.filter((w) => w.type === typeFilter);
      }
      if (parentId) {
        workspaces = workspaces.filter((w) => w.parent_id === parentId);
      }

      // Apply sorting if order_by is specified
      if (orderBy) {
        const isDescending = orderBy.startsWith('-');
        const field = isDescending ? orderBy.slice(1) : orderBy;

        workspaces = workspaces.sort((a, b) => {
          const aVal = a[field as keyof WorkspacesWorkspace] ?? '';
          const bVal = b[field as keyof WorkspacesWorkspace] ?? '';
          const comparison = String(aVal).localeCompare(String(bVal));
          return isDescending ? -comparison : comparison;
        });
      }

      options.onList?.(url.searchParams);
      return HttpResponse.json(paginate(workspaces, offset, limit));
    }),

    http.get('*/api/rbac/v2/workspaces/:workspaceId/', async ({ params }) => {
      await delay(networkDelay);
      const workspace = collection.findFirst((q) => q.where({ id: params.workspaceId as string }));
      if (!workspace) {
        return new HttpResponse(null, { status: 404 });
      }
      options.onRead?.(params.workspaceId);
      return HttpResponse.json(workspace);
    }),

    http.post('*/api/rbac/v2/workspaces/', async ({ request }) => {
      await delay(networkDelay);
      const body = (await request.json()) as { name: string; description?: string; parent_id?: string };
      const newWorkspace: WorkspacesWorkspace = {
        id: `workspace-${Date.now()}`,
        name: body.name,
        description: body.description || '',
        parent_id: body.parent_id,
        type: 'standard',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };
      await collection.create(newWorkspace);
      options.onCreate?.(body);
      return HttpResponse.json(newWorkspace, { status: 201 });
    }),

    http.patch('*/api/rbac/v2/workspaces/:workspaceId/', async ({ params, request }) => {
      await delay(networkDelay);
      const body = (await request.json()) as Partial<WorkspacesWorkspace>;
      const workspaceId = params.workspaceId as string;
      const updated = await collection.update((q) => q.where({ id: workspaceId }), {
        data(w) {
          if (body.name !== undefined) w.name = body.name;
          if (body.description !== undefined) w.description = body.description;
          if (body.parent_id !== undefined) w.parent_id = body.parent_id;
          w.modified = new Date().toISOString();
        },
      });
      if (!updated) {
        return new HttpResponse(null, { status: 404 });
      }
      options.onUpdate?.(params.workspaceId, body);
      return HttpResponse.json(updated);
    }),

    http.delete('*/api/rbac/v2/workspaces/:workspaceId/', async ({ params }) => {
      await delay(networkDelay);
      const workspaceId = params.workspaceId as string;
      const deleted = collection.delete((q) => q.where({ id: workspaceId }));
      if (!deleted) {
        return new HttpResponse(null, { status: 404 });
      }
      options.onDelete?.(workspaceId);
      return new HttpResponse(null, { status: 204 });
    }),

    http.post('*/api/rbac/v2/workspaces/:workspaceId/move', async ({ params, request }) => {
      await delay(networkDelay);
      const body = (await request.json()) as { parent_id: string };
      const workspaceId = params.workspaceId as string;
      const updated = await collection.update((q) => q.where({ id: workspaceId }), {
        data(w) {
          w.parent_id = body.parent_id;
          w.modified = new Date().toISOString();
        },
      });
      if (!updated) {
        return new HttpResponse(null, { status: 404 });
      }
      options.onMove?.(params.workspaceId, body.parent_id);
      return HttpResponse.json(updated);
    }),
  ];
}

/** Convenience wrapper — creates a Collection internally */
export function workspacesHandlers(data?: WorkspacesWorkspace[], options?: WorkspacesHandlerOptions) {
  return createWorkspacesHandlers(createSeededCollection(data ?? DEFAULT_WORKSPACES), options);
}

/** All workspace endpoints return the given error status */
export function workspacesErrorHandlers(status: number = 500) {
  const body = { error: 'Error' };
  return [
    http.get('*/api/rbac/v2/workspaces/', () => HttpResponse.json(body, { status })),
    http.get('*/api/rbac/v2/workspaces/:workspaceId/', () => HttpResponse.json(body, { status })),
    http.post('*/api/rbac/v2/workspaces/', () => HttpResponse.json(body, { status })),
    http.patch('*/api/rbac/v2/workspaces/:workspaceId/', () => HttpResponse.json(body, { status })),
    http.delete('*/api/rbac/v2/workspaces/:workspaceId/', () => HttpResponse.json(body, { status })),
    http.post('*/api/rbac/v2/workspaces/:workspaceId/move', () => HttpResponse.json(body, { status })),
  ];
}

// ============================================================================
// Kessel ready-check handlers (post-create permission polling)
// ============================================================================

export interface WorkspaceReadyCheckOptions {
  /** Milliseconds after handler creation before permissions become allowed. Default: 3000 */
  readyAfterMs?: number;
}

/**
 * MSW handler that simulates the Kessel /checkselfbulk endpoint for workspace
 * permission polling. All relations flip to allowed: true after readyAfterMs.
 */
export function workspaceReadyCheckHandler(workspaceId: string, options: WorkspaceReadyCheckOptions = {}) {
  const readyAfter = options.readyAfterMs ?? 3000;
  const startTime = Date.now();

  return http.post('*/api/kessel/v1beta2/checkselfbulk', async ({ request }) => {
    const body = (await request.json()) as {
      items?: Array<{ object?: { resourceId?: string; resourceType?: string }; relation?: string }>;
    };
    const items = body.items ?? [];
    const isForWorkspace = items.some((item) => item.object?.resourceId === workspaceId);

    if (isForWorkspace) {
      const allowed = Date.now() - startTime >= readyAfter;
      return HttpResponse.json({
        results: items.map((item) => ({
          allowed,
          resource: { id: item.object?.resourceId, type: item.object?.resourceType },
          relation: item.relation,
        })),
      });
    }

    return HttpResponse.json({ results: [] });
  });
}

/**
 * Kessel handler where permissions never become allowed (timeout testing).
 */
export function workspaceReadyCheckNeverHandler() {
  return http.post('*/api/kessel/v1beta2/checkselfbulk', async ({ request }) => {
    const body = (await request.json()) as {
      items?: Array<{ object?: { resourceId?: string; resourceType?: string }; relation?: string }>;
    };
    const items = body.items ?? [];
    return HttpResponse.json({
      results: items.map((item) => ({
        allowed: false,
        resource: { id: item.object?.resourceId, type: item.object?.resourceType },
        relation: item.relation,
      })),
    });
  });
}

/**
 * Kessel handler where permissions are immediately allowed (instant success testing).
 */
export function workspaceReadyCheckInstantHandler() {
  return http.post('*/api/kessel/v1beta2/checkselfbulk', async ({ request }) => {
    const body = (await request.json()) as {
      items?: Array<{ object?: { resourceId?: string; resourceType?: string }; relation?: string }>;
    };
    const items = body.items ?? [];
    return HttpResponse.json({
      results: items.map((item) => ({
        allowed: true,
        resource: { id: item.object?.resourceId, type: item.object?.resourceType },
        relation: item.relation,
      })),
    });
  });
}

/** All workspace endpoints delay forever (loading state) */
export function workspacesLoadingHandlers() {
  const handler = async () => {
    await delay('infinite');
    return new HttpResponse(null);
  };
  return [
    http.get('*/api/rbac/v2/workspaces/', handler),
    http.get('*/api/rbac/v2/workspaces/:workspaceId/', handler),
    http.post('*/api/rbac/v2/workspaces/', handler),
    http.patch('*/api/rbac/v2/workspaces/:workspaceId/', handler),
    http.delete('*/api/rbac/v2/workspaces/:workspaceId/', handler),
    http.post('*/api/rbac/v2/workspaces/:workspaceId/move', handler),
  ];
}
