import { HttpResponse, delay, http } from 'msw';
import type {
  TenantApiErrorResponse,
  TenantOptInEligibility,
  TenantOptInIneligibleResponse,
  TenantOptInResponse,
} from '../../../shared/data/api/tenant';

const MOCK_DELAY = 200;
const OPT_IN_PATH = '*/api/rbac/v1/tenant/opt-in/';

export interface TenantOptInHandlerOptions {
  networkDelay?: number;
  /** Called when the opt-in PATCH is sent, so stories can assert it was (or was not) reached. */
  onOptIn?: (body: unknown) => void;
  /**
   * Called when the eligibility GET is sent. The wizard asks before it writes, so a story that
   * counts requests has to count both.
   */
  onEligibility?: () => void;
  /**
   * Opt-in status reported by GET. The app shell reads this to decide whether to render V2,
   * so it has to be answered even by stories that only care about the wizard.
   * Defaults to false — the state a tenant is in before it converts.
   */
  optedIn?: boolean;
}

export interface TenantOptInErrorOptions extends TenantOptInHandlerOptions {
  /**
   * `errors[].detail` in the rejection envelope. Pass `null` for an envelope that carries no
   * detail at all, which is what sends `failureDetail` on to its status-specific messages.
   */
  detail?: string | null;
}

/** The ineligibility report, which the API returns both from the eligibility GET and from a 422. */
const ineligibleBody = (overrides: Partial<TenantOptInIneligibleResponse> = {}): TenantOptInIneligibleResponse => ({
  eligible: false,
  bootstrapped: false,
  ineligible_custom_roles: [{ uuid: 'role-1', name: 'Legacy Auditor', ineligible_applications: ['inventory'] }],
  ineligible_groups: [{ uuid: 'group-1', name: 'Platform Admins', ineligible_system_roles: [] }],
  ...overrides,
});

/** An RBAC error envelope. `detail: null` produces one with no detail for `failureDetail` to find. */
const errorBody = (status: number, detail: string | null): TenantApiErrorResponse => ({
  errors: [detail === null ? { source: 'detail', status: String(status) } : { detail, source: 'detail', status: String(status) }],
});

/** `GET /tenant/opt-in/` — the status read the app shell makes. Shared by every factory here. */
const optInStatusHandler = (options: TenantOptInHandlerOptions) =>
  http.get(OPT_IN_PATH, async () => {
    await delay(options.networkDelay ?? MOCK_DELAY);
    return HttpResponse.json<TenantOptInResponse>({ v2_opted_in: options.optedIn ?? false });
  });

/**
 * Eligibility and opt-in endpoints for a tenant that converts cleanly.
 */
export function tenantOptInHandlers(options: TenantOptInHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    optInStatusHandler(options),
    http.get(`${OPT_IN_PATH}eligibility/`, async () => {
      await delay(networkDelay);
      options.onEligibility?.();
      return HttpResponse.json<TenantOptInEligibility>({ eligible: true });
    }),
    http.patch(OPT_IN_PATH, async ({ request }) => {
      await delay(networkDelay);
      options.onOptIn?.(await request.json());
      return HttpResponse.json<TenantOptInResponse>({ v2_opted_in: true });
    }),
  ];
}

/**
 * The eligibility check reports blockers. The opt-in PATCH is still registered so a story
 * can prove the wizard never sends it.
 */
export function tenantIneligibleHandlers(ineligible: Partial<TenantOptInIneligibleResponse> = {}, options: TenantOptInHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    optInStatusHandler(options),
    http.get(`${OPT_IN_PATH}eligibility/`, async () => {
      await delay(networkDelay);
      options.onEligibility?.();
      return HttpResponse.json<TenantOptInEligibility>(ineligibleBody(ineligible));
    }),
    http.patch(OPT_IN_PATH, async ({ request }) => {
      await delay(networkDelay);
      options.onOptIn?.(await request.json());
      return HttpResponse.json(errorBody(422, 'Opt-in is not possible.'), { status: 422 });
    }),
  ];
}

/**
 * The eligibility check itself fails. Nothing is known about the tenant, so the wizard must treat
 * it as a failure rather than assuming the conversion would have been allowed; the PATCH is
 * registered so a story can prove it was never sent.
 */
export function tenantEligibilityErrorHandlers(status: number = 500, options: TenantOptInErrorOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;
  const detail = options.detail ?? null;

  return [
    optInStatusHandler(options),
    http.get(`${OPT_IN_PATH}eligibility/`, async () => {
      await delay(networkDelay);
      options.onEligibility?.();
      return HttpResponse.json(errorBody(status, detail), { status });
    }),
    http.patch(OPT_IN_PATH, async ({ request }) => {
      await delay(networkDelay);
      options.onOptIn?.(await request.json());
      return HttpResponse.json<TenantOptInResponse>({ v2_opted_in: true });
    }),
  ];
}

/**
 * Eligibility passes but the opt-in PATCH comes back 422 carrying the ineligibility report —
 * a tenant that became ineligible between the two calls. Reaches the same screen as
 * {@link tenantIneligibleHandlers} by an entirely different route through `failureDetail`.
 */
export function tenantOptInIneligibleRejectionHandlers(
  ineligible: Partial<TenantOptInIneligibleResponse> = {},
  options: TenantOptInHandlerOptions = {},
) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    optInStatusHandler(options),
    http.get(`${OPT_IN_PATH}eligibility/`, async () => {
      await delay(networkDelay);
      options.onEligibility?.();
      return HttpResponse.json<TenantOptInEligibility>({ eligible: true });
    }),
    http.patch(OPT_IN_PATH, async ({ request }) => {
      await delay(networkDelay);
      options.onOptIn?.(await request.json());
      return HttpResponse.json(ineligibleBody(ineligible), { status: 422 });
    }),
  ];
}

/**
 * Tenant is eligible, but the opt-in PATCH is rejected with an RBAC error envelope.
 */
export function tenantOptInErrorHandlers(status: number = 403, options: TenantOptInErrorOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;
  const detail = options.detail === undefined ? 'You do not have permission to perform this action.' : options.detail;

  return [
    optInStatusHandler(options),
    http.get(`${OPT_IN_PATH}eligibility/`, async () => {
      await delay(networkDelay);
      options.onEligibility?.();
      return HttpResponse.json<TenantOptInEligibility>({ eligible: true });
    }),
    http.patch(OPT_IN_PATH, async ({ request }) => {
      await delay(networkDelay);
      options.onOptIn?.(await request.json());
      return HttpResponse.json(errorBody(status, detail), { status });
    }),
  ];
}
