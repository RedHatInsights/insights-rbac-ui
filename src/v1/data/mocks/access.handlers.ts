import { HttpResponse, delay, http } from 'msw';
import { type Access, defaultAccessPermissions } from './access.fixtures';

const MOCK_DELAY = 200;

export interface AccessHandlerOptions {
  networkDelay?: number;
  onList?: (params: URLSearchParams) => void;
}

export function createAccessHandlers(permissions: Access[], options: AccessHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/rbac/v1/access/', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);
      const application = url.searchParams.get('application');

      let filtered = permissions;

      if (application) {
        const apps = application.split(',').map((a) => a.trim());
        filtered = permissions.filter((p) => apps.some((app) => p.permission.startsWith(app + ':')));
      }

      const paginated = filtered.slice(offset, offset + limit);

      options.onList?.(url.searchParams);
      return HttpResponse.json({
        data: paginated,
        meta: { count: filtered.length, limit, offset },
      });
    }),
  ];
}

/** Convenience wrapper with default data */
export function accessHandlers(data?: Access[], options?: AccessHandlerOptions) {
  return createAccessHandlers(data ?? defaultAccessPermissions, options);
}

/** All access endpoints return the given error status */
export function accessErrorHandlers(status: number = 500) {
  return [http.get('*/api/rbac/v1/access/', () => HttpResponse.json({ error: 'Error' }, { status }))];
}

/** All access endpoints delay forever (loading state) */
export function accessLoadingHandlers() {
  return [
    http.get('*/api/rbac/v1/access/', async () => {
      await delay('infinite');
      return new HttpResponse(null);
    }),
  ];
}
