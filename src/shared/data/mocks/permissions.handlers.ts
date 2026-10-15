import { HttpResponse, delay, http } from 'msw';
import type { Permission } from '../api/permissions';
import { DEFAULT_PERMISSIONS, DEFAULT_PERMISSION_OPTIONS } from './seed';

export type { Permission };

const MOCK_DELAY = 200;

export interface PermissionsHandlerOptions {
  networkDelay?: number;
  onList?: (params: URLSearchParams) => void;
}

export function createPermissionsHandlers(permissions: Permission[], options: PermissionsHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/rbac/v1/permissions/', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      const application = url.searchParams.get('application');

      let filtered = [...permissions];
      if (application) {
        const apps = application.split(',').map((a) => a.trim());
        filtered = filtered.filter((p) => p.application && apps.includes(p.application));
      }

      const paginated = filtered.slice(offset, offset + limit);

      options.onList?.(url.searchParams);
      return HttpResponse.json({
        data: paginated,
        meta: { count: filtered.length, limit, offset },
      });
    }),

    http.get('*/api/rbac/v1/permissions/options/', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const field = url.searchParams.get('field');

      if (field === 'application') {
        return HttpResponse.json({ data: DEFAULT_PERMISSION_OPTIONS.applications });
      } else if (field === 'resource_type') {
        return HttpResponse.json({ data: DEFAULT_PERMISSION_OPTIONS.resourceTypes });
      } else if (field === 'verb') {
        return HttpResponse.json({ data: DEFAULT_PERMISSION_OPTIONS.verbs });
      }

      return HttpResponse.json({ data: [] });
    }),
  ];
}

/** Convenience wrapper with default data */
export function permissionsHandlers(data?: Permission[], options?: PermissionsHandlerOptions) {
  return createPermissionsHandlers(data ?? DEFAULT_PERMISSIONS, options);
}

/** All permissions endpoints return the given error status */
export function permissionsErrorHandlers(status: number = 500) {
  const body = { error: 'Error' };
  return [
    http.get('*/api/rbac/v1/permissions/', () => HttpResponse.json(body, { status })),
    http.get('*/api/rbac/v1/permissions/options/', () => HttpResponse.json(body, { status })),
  ];
}

/** All permissions endpoints delay forever (loading state) */
export function permissionsLoadingHandlers() {
  const handler = async () => {
    await delay('infinite');
    return new HttpResponse(null);
  };
  return [http.get('*/api/rbac/v1/permissions/', handler), http.get('*/api/rbac/v1/permissions/options/', handler)];
}
