import { HttpResponse, delay, http } from 'msw';
import type { MockCollection, Principal, ResettableMap } from './db';

const MOCK_DELAY = 200;

export interface AccountManagementHandlerOptions {
  networkDelay?: number;
  /** Called with (request, body) so callers can capture request.url for URL verification */
  onInvite?: (request: Request, body: unknown) => void;
  onToggleStatus?: (...args: unknown[]) => void;
  onToggleOrgAdmin?: (...args: unknown[]) => void;
  onGetUserDetail?: (userId: string) => void;
  onToggleSupportCases?: (userId: string, grant: boolean) => void;
  /** When provided, org admin POST/DELETE updates `is_org_admin` so the next principals refetch reflects the toggle */
  users?: MockCollection<Principal>;
  /** Map from external_source_id → portal permissions array. Used for GET user detail + toggle support cases. */
  userPermissions?: ResettableMap<string, string[]> | Map<string, string[]>;
}

async function applyOrgAdminUpdate(
  users: MockCollection<Principal> | undefined,
  userId: string | readonly string[] | undefined,
  isOrgAdmin: boolean,
) {
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

/** Build the GET account-user-detail response (user info + portal permissions). */
function buildUserDetailResponse(options: AccountManagementHandlerOptions, userId: string) {
  options.onGetUserDetail?.(userId);

  const user = options.users?.all().find((u) => String(u.external_source_id) === userId);
  const permissions = options.userPermissions?.get(userId) ?? [];

  return HttpResponse.json({
    id: userId,
    username: user?.username ?? `user-${userId}`,
    roles: user?.is_org_admin ? ['organization_administrator'] : [],
    permissions,
  });
}

/** Shape of the account/v1 update-user request body (the full user object with permissions array). */
interface UpdateUserBody {
  permissions?: string[];
}

/**
 * Apply a POST toggle of the portal_manage_cases permission on the account/v1 endpoint.
 * The write sends the updated `permissions` array; grant/revoke is derived from whether
 * the array contains portal_manage_cases.
 */
async function applySupportCasesToggle(options: AccountManagementHandlerOptions, userId: string, request: Request) {
  const body = (await request.json()) as UpdateUserBody;
  const grant = (body.permissions ?? []).includes('portal_manage_cases');

  options.onToggleSupportCases?.(userId, grant);

  if (options.userPermissions) {
    const current = options.userPermissions.get(userId) ?? [];
    if (grant && !current.includes('portal_manage_cases')) {
      options.userPermissions.set(userId, [...current, 'portal_manage_cases']);
    } else if (!grant) {
      options.userPermissions.set(
        userId,
        current.filter((p) => p !== 'portal_manage_cases'),
      );
    }
  }

  return HttpResponse.json({ success: true });
}

export function createAccountManagementHandlers(options: AccountManagementHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.post(/api\.access\.(stage\.)?redhat\.com.*\/users\/invite/, async ({ request }) => {
      await delay(networkDelay);
      const body = (await request.json()) as Record<string, unknown>;
      options.onInvite?.(request, body);

      const allowedKeys = new Set(['emails', 'localeCode', 'roles', 'permissions']);
      const unexpectedKey = Object.keys(body).find((key) => !allowedKeys.has(key));
      if (unexpectedKey) {
        return HttpResponse.json({ type: 'about:blank', title: 'Bad Request', status: 400, detail: 'Failed to read request' }, { status: 400 });
      }
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

      // GET account user detail — returns user info + portal permissions
      http.get(`${baseUrl}/account/v1/accounts/:accountId/users/:userId`, async ({ params }) => {
        await delay(networkDelay);
        return buildUserDetailResponse(options, String(params.userId));
      }),

      // POST toggle portal_manage_cases — updated permissions array on the same user resource
      http.post(`${baseUrl}/account/v1/accounts/:accountId/users/:userId`, async ({ params, request }) => {
        await delay(networkDelay);
        return applySupportCasesToggle(options, String(params.userId), request);
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

    // Fallback: GET account user detail (regex — catches any origin)
    http.get(/account\/v1\/accounts\/[^/]+\/users\/[^/]+$/, async ({ request }) => {
      await delay(networkDelay);
      const userId = new URL(request.url).pathname.split('/').pop() ?? '';
      return buildUserDetailResponse(options, userId);
    }),

    // Fallback: POST toggle portal_manage_cases (regex — catches any origin)
    // Uses [^/]+$ to avoid matching .../status or .../roles sub-paths
    http.post(/account\/v1\/accounts\/[^/]+\/users\/[^/]+$/, async ({ request }) => {
      await delay(networkDelay);
      const userId = new URL(request.url).pathname.split('/').pop() ?? '';
      return applySupportCasesToggle(options, userId, request);
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
    http.get(/account\/v1\/accounts\/.+\/users\/[^/]+$/, () => HttpResponse.json(body, { status })),
    http.post(/account\/v1\/accounts\/.+\/users\/[^/]+$/, () => HttpResponse.json(body, { status })),
  ];
}

/**
 * Only the invite POST fails; every other account endpoint is left to succeeding
 * handlers. List this BEFORE the success handlers so the failing invite wins while the
 * users list (and its support-cases column) still loads normally.
 */
export function inviteErrorHandlers(status: number = 500) {
  const body = { error: 'Error' };
  return [http.post(/api\.access\.(stage\.)?redhat\.com.*\/users\/invite/, () => HttpResponse.json(body, { status }))];
}

/**
 * Only the support-cases toggle POST fails; GET (and other endpoints) are left to
 * succeeding handlers. List this BEFORE the success handlers so the failing POST wins,
 * while the GET still loads the initial state for optimistic-rollback stories.
 */
export function supportCasesTogglePostErrorHandlers(status: number = 500) {
  const body = { error: 'Error' };
  return [http.post(/account\/v1\/accounts\/[^/]+\/users\/[^/]+$/, () => HttpResponse.json(body, { status }))];
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
    http.get(/account\/v1\/accounts\/.+\/users\/[^/]+$/, handler),
    http.post(/account\/v1\/accounts\/.+\/users\/[^/]+$/, handler),
  ];
}
