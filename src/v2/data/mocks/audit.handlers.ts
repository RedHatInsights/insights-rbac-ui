import { HttpResponse, delay, http } from 'msw';
import type { AuditLog } from '../api/audit';
import { defaultAuditLogs } from './audit.fixtures';

const MOCK_DELAY = 200;

export interface AuditHandlerOptions {
  networkDelay?: number;
  onList?: (params: URLSearchParams) => void;
}

function applyFilters(entries: AuditLog[], params: URLSearchParams): AuditLog[] {
  let filtered = entries;

  const principalUsername = params.get('principal_username');
  if (principalUsername) {
    const lower = principalUsername.toLowerCase();
    filtered = filtered.filter((e) => e.principal_username?.toLowerCase().includes(lower));
  }

  const resourceTypes = params.getAll('resource_type').flatMap((v) => v.split(',').filter(Boolean));
  if (resourceTypes.length > 0) {
    filtered = filtered.filter((e) => resourceTypes.includes(e.resource_type ?? ''));
  }

  const actions = params.getAll('action').flatMap((v) => v.split(',').filter(Boolean));
  if (actions.length > 0) {
    filtered = filtered.filter((e) => actions.includes(e.action ?? ''));
  }

  return filtered;
}

export function auditHandlers(entries: AuditLog[] = defaultAuditLogs, options: AuditHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/rbac/v1/auditlogs/', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);

      options.onList?.(url.searchParams);

      const filtered = applyFilters(entries, url.searchParams);
      const paginated = filtered.slice(offset, offset + limit);
      const total = filtered.length;
      const baseUrl = '/api/rbac/v1/auditlogs/';
      const lastOffset = Math.floor(Math.max(total - 1, 0) / limit) * limit;

      return HttpResponse.json({
        data: paginated,
        meta: { count: total, limit, offset },
        links: {
          first: `${baseUrl}?limit=${limit}&offset=0`,
          next: offset + limit < total ? `${baseUrl}?limit=${limit}&offset=${offset + limit}` : null,
          previous: offset > 0 ? `${baseUrl}?limit=${limit}&offset=${Math.max(offset - limit, 0)}` : null,
          last: `${baseUrl}?limit=${limit}&offset=${lastOffset}`,
        },
      });
    }),
  ];
}

export function auditErrorHandlers(status = 500, options: AuditHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/rbac/v1/auditlogs/', async () => {
      await delay(networkDelay);
      return HttpResponse.json({ errors: [{ detail: 'Internal server error', status: String(status) }] }, { status });
    }),
  ];
}

export function auditLoadingHandlers() {
  return [
    http.get('*/api/rbac/v1/auditlogs/', async () => {
      await delay(999999);
      return HttpResponse.json({ data: [], meta: { count: 0, limit: 20, offset: 0 } });
    }),
  ];
}
