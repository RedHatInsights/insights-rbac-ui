import { HttpResponse, delay, http } from 'msw';
import type { MockCollection, Principal } from './db';

const MOCK_DELAY = 200;

export interface AccountManagementHandlerOptions {
  networkDelay?: number;
  /** Called with (request, body) so callers can capture request.url for URL verification */
  onInvite?: (request: Request, body: unknown) => void;
  onToggleStatus?: (...args: unknown[]) => void;
  onToggleOrgAdmin?: (...args: unknown[]) => void;
  /** When provided, org admin POST/DELETE updates `is_org_admin` so the next principals refetch reflects the toggle */
  users?: MockCollection<Principal>;
}

async function applyOrgAdminUpdate(users: MockCollection<Principal> | undefined, userId: string | readonly string[] | undefined, isOrgAdmin: boolean) {
  if (!users || userId == null) return;
  const id = String(userId);
  const match = users.all().find((u) => String(u.external_source_id) === id);
  if (!match) return;
  await users.update((q) => q.where({ username: match.username }), {
    data(u) {
      u.is_org_admin = isOrgAdmin;
    },
  });
}

export function createAccountManagementHandlers(options: AccountManagementHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.post(/api\.access\.(stage\.)?redhat\.com.*\/users\/invite/, async ({ request }) => {
      await delay(networkDelay);
      const body = await request.json();
      options.onInvite?.(request, body);
      return HttpResponse.json({ success: true });
    }),

    http.post('https://api.access.redhat.com/account/v1/accounts/:accountId/users/:userId/status', async ({ params, request }) => {
      await delay(networkDelay);
      const body = await request.json();
      options.onToggleStatus?.(params.accountId, params.userId, body);
      return HttpResponse.json({ success: true });
    }),

    http.post('https://api.access.stage.redhat.com/account/v1/accounts/:accountId/users/:userId/status', async ({ params, request }) => {
      await delay(networkDelay);
      const body = await request.json();
      options.onToggleStatus?.(params.accountId, params.userId, body);
      return HttpResponse.json({ success: true });
    }),

    http.post(/api\.access\.(stage\.)?redhat\.com.*\/account\/v1\/accounts\/.+\/users\/.+\/status/, async ({ request }) => {
      await delay(networkDelay);
      const body = await request.json();
      options.onToggleStatus?.(body);
      return HttpResponse.json({ success: true });
    }),

    http.post(/account\/v1\/accounts\/.+\/users\/.+\/status/, async ({ request }) => {
      await delay(networkDelay);
      const body = await request.json();
      options.onToggleStatus?.(body);
      return HttpResponse.json({ success: true });
    }),

    // Org admin role toggle — POST grants, DELETE revokes
    ...['https://api.access.stage.redhat.com', 'https://api.access.redhat.com'].flatMap((baseUrl) => [
      http.post(`${baseUrl}/account/v1/accounts/:accountId/users/:userId/roles`, async ({ params, request }) => {
        await delay(networkDelay);
        const body = await request.json();
        await applyOrgAdminUpdate(options.users, params.userId, true);
        options.onToggleOrgAdmin?.(params.accountId, params.userId, body);
        return HttpResponse.json({ success: true });
      }),
      http.delete(`${baseUrl}/account/v1/accounts/:accountId/users/:userId/roles`, async ({ params, request }) => {
        await delay(networkDelay);
        const body = await request.json();
        await applyOrgAdminUpdate(options.users, params.userId, false);
        options.onToggleOrgAdmin?.(params.accountId, params.userId, body);
        return HttpResponse.json({ success: true });
      }),
    ]),

    // Fallback regex variants
    http.post(/account\/v1\/accounts\/.+\/users\/.+\/roles/, async ({ request }) => {
      await delay(networkDelay);
      const body = await request.json();
      const userId = new URL(request.url).pathname.split('/').at(-2);
      await applyOrgAdminUpdate(options.users, userId, true);
      options.onToggleOrgAdmin?.('', '', body);
      return HttpResponse.json({ success: true });
    }),
    http.delete(/account\/v1\/accounts\/.+\/users\/.+\/roles/, async ({ request }) => {
      await delay(networkDelay);
      const body = await request.json();
      const userId = new URL(request.url).pathname.split('/').at(-2);
      await applyOrgAdminUpdate(options.users, userId, false);
      options.onToggleOrgAdmin?.('', '', body);
      return HttpResponse.json({ success: true });
    }),
  ];
}

/** Convenience wrapper */
export function accountManagementHandlers(options?: AccountManagementHandlerOptions) {
  return createAccountManagementHandlers(options);
}

/** All account management endpoints return the given error status */
export function accountManagementErrorHandlers(status: number = 500) {
  const body = { error: 'Error' };
  return [
    http.post(/api\.access\.(stage\.)?redhat\.com.*\/users\/invite/, () => HttpResponse.json(body, { status })),
    http.post(/account\/v1\/accounts\/.+\/users\/.+\/status/, () => HttpResponse.json(body, { status })),
    http.post(/account\/v1\/accounts\/.+\/users\/.+\/roles/, () => HttpResponse.json(body, { status })),
    http.delete(/account\/v1\/accounts\/.+\/users\/.+\/roles/, () => HttpResponse.json(body, { status })),
  ];
}

/** All account management endpoints delay forever (loading state) */
export function accountManagementLoadingHandlers() {
  const handler = async () => {
    await delay('infinite');
    return new HttpResponse(null);
  };
  return [
    http.post(/api\.access\.(stage\.)?redhat\.com.*\/users\/invite/, handler),
    http.post(/account\/v1\/accounts\/.+\/users\/.+\/status/, handler),
    http.post(/account\/v1\/accounts\/.+\/users\/.+\/roles/, handler),
    http.delete(/account\/v1\/accounts\/.+\/users\/.+\/roles/, handler),
  ];
}
