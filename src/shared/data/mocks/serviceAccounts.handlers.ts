import { HttpResponse, delay, http } from 'msw';
import type { MockServiceAccount } from './db';
import { DEFAULT_SERVICE_ACCOUNTS } from './seed';

const MOCK_DELAY = 200;

export interface ServiceAccountsHandlerOptions {
  networkDelay?: number;
}

export function createServiceAccountsHandlers(serviceAccounts: MockServiceAccount[], options: ServiceAccountsHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get('*/api/rbac/v1/service-accounts/', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
      const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

      const paginated = serviceAccounts.slice(offset, offset + limit);

      return HttpResponse.json({
        data: paginated,
        meta: { count: serviceAccounts.length, limit, offset },
      });
    }),

    // SSO format (production URLs)
    http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', async () => {
      await delay(networkDelay);
      return HttpResponse.json(serviceAccounts);
    }),

    http.get('https://sso.stage.redhat.com/realms/redhat-external/apis/service_accounts/v1', async () => {
      await delay(networkDelay);
      return HttpResponse.json(serviceAccounts);
    }),

    // Generic SSO service_accounts/v1 path
    http.get('*/service_accounts/v1', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const first = parseInt(url.searchParams.get('first') ?? '0', 10);
      const max = parseInt(url.searchParams.get('max') ?? '21', 10);
      return HttpResponse.json(serviceAccounts.slice(first, first + max));
    }),
  ];
}

/** Convenience wrapper with default data */
export function serviceAccountsHandlers(data?: MockServiceAccount[], options?: ServiceAccountsHandlerOptions) {
  return createServiceAccountsHandlers(data ?? DEFAULT_SERVICE_ACCOUNTS, options);
}

/** All service accounts endpoints return the given error status */
export function serviceAccountsErrorHandlers(status: number = 500) {
  const body = { error: 'Error' };
  return [
    http.get('*/api/rbac/v1/service-accounts/', () => HttpResponse.json(body, { status })),
    http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', () => HttpResponse.json(body, { status })),
    http.get('https://sso.stage.redhat.com/realms/redhat-external/apis/service_accounts/v1', () => HttpResponse.json(body, { status })),
    http.get('*/service_accounts/v1', () => HttpResponse.json(body, { status })),
  ];
}

/** All service accounts endpoints delay forever (loading state) */
export function serviceAccountsLoadingHandlers() {
  const handler = async () => {
    await delay('infinite');
    return new HttpResponse(null);
  };
  return [
    http.get('*/api/rbac/v1/service-accounts/', handler),
    http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', handler),
    http.get('https://sso.stage.redhat.com/realms/redhat-external/apis/service_accounts/v1', handler),
    http.get('*/service_accounts/v1', handler),
  ];
}
