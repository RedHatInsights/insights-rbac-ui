import { HttpResponse, delay, http } from 'msw';
import type { MockCollection, MockServiceAccount } from './db';
import type { ServiceAccount } from '../api/serviceAccounts';
import { DEFAULT_SERVICE_ACCOUNTS } from './seed';

const MOCK_DELAY = 200;

export interface ServiceAccountsHandlerOptions {
  networkDelay?: number;
}

/** Filter accounts by type query parameter if present */
function filterByType(accounts: MockServiceAccount[], typeParam: string | null): MockServiceAccount[] {
  if (!typeParam) return accounts;
  return accounts.filter((a) => {
    const accountType = a.type ?? 'service_account';
    return accountType === typeParam;
  });
}

export function createServiceAccountsHandlers(
  serviceAccounts: MockServiceAccount[] | MockCollection<MockServiceAccount>,
  options: ServiceAccountsHandlerOptions = {},
) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;
  const getAccounts = () => (Array.isArray(serviceAccounts) ? serviceAccounts : serviceAccounts.all());
  const toSsoAccount = (account: MockServiceAccount): ServiceAccount => ({
    id: account.uuid,
    clientId: account.clientId,
    name: account.name,
    description: account.description,
    createdBy: account.owner,
    createdAt: account.timeCreated,
    ...(account.type ? { type: account.type } : {}),
  });

  return [
    http.get('*/api/rbac/v1/service-accounts/', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
      const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
      const typeParam = url.searchParams.get('type');

      const filtered = filterByType(getAccounts(), typeParam);
      const paginated = filtered.slice(offset, offset + limit);

      return HttpResponse.json({
        data: paginated,
        meta: { count: filtered.length, limit, offset },
      });
    }),

    // SSO format (production URLs)
    http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const first = Number(url.searchParams.get('first') ?? 0);
      const max = Number(url.searchParams.get('max') ?? 21);
      const typeParam = url.searchParams.get('type');
      const filtered = filterByType(getAccounts(), typeParam).map(toSsoAccount);
      return HttpResponse.json(filtered.slice(first, first + max));
    }),

    http.get('https://sso.stage.redhat.com/realms/redhat-external/apis/service_accounts/v1', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const first = Number(url.searchParams.get('first') ?? 0);
      const max = Number(url.searchParams.get('max') ?? 21);
      const typeParam = url.searchParams.get('type');
      const filtered = filterByType(getAccounts(), typeParam).map(toSsoAccount);
      return HttpResponse.json(filtered.slice(first, first + max));
    }),

    // Generic SSO service_accounts/v1 path
    http.get('*/service_accounts/v1', async ({ request }) => {
      await delay(networkDelay);
      const url = new URL(request.url);
      const first = parseInt(url.searchParams.get('first') ?? '0', 10);
      const max = parseInt(url.searchParams.get('max') ?? '21', 10);
      const typeParam = url.searchParams.get('type');
      const filtered = filterByType(getAccounts(), typeParam).map(toSsoAccount);
      return HttpResponse.json(filtered.slice(first, first + max));
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
