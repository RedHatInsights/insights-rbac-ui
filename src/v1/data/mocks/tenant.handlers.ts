import { HttpResponse, delay, http } from 'msw';
import type { TenantOptInEligibility, TenantOptInIneligibleResponse, TenantOptInResponse } from '../../../shared/data/api/tenant';

const MOCK_DELAY = 200;
const OPT_IN_PATH = '*/api/rbac/v1/tenant/opt-in/';

export interface TenantOptInHandlerOptions {
  networkDelay?: number;
  /** Called when the opt-in PATCH is sent, so stories can assert it was (or was not) reached. */
  onOptIn?: (body: unknown) => void;
  /**
   * Opt-in status reported by GET. The app shell reads this to decide whether to render V2,
   * so it has to be answered even by stories that only care about the wizard.
   * Defaults to false — the state a tenant is in before it converts.
   */
  optedIn?: boolean;
}

/**
 * Eligibility and opt-in endpoints for a tenant that converts cleanly.
 */
export function tenantOptInHandlers(options: TenantOptInHandlerOptions = {}) {
  const networkDelay = options.networkDelay ?? MOCK_DELAY;

  return [
    http.get(OPT_IN_PATH, async () => {
      await delay(networkDelay);
      return HttpResponse.json<TenantOptInResponse>({ v2_opted_in: options.optedIn ?? false });
    }),
    http.get(`${OPT_IN_PATH}eligibility/`, async () => {
      await delay(networkDelay);
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
    http.get(OPT_IN_PATH, async () => {
      await delay(networkDelay);
      return HttpResponse.json<TenantOptInResponse>({ v2_opted_in: options.optedIn ?? false });
    }),
    http.get(`${OPT_IN_PATH}eligibility/`, async () => {
      await delay(networkDelay);
      return HttpResponse.json<TenantOptInEligibility>({
        eligible: false,
        bootstrapped: false,
        ineligible_custom_roles: [{ uuid: 'role-1', name: 'Legacy Auditor', ineligible_applications: ['inventory'] }],
        ineligible_groups: [{ uuid: 'group-1', name: 'Platform Admins', ineligible_system_roles: [] }],
        ...ineligible,
      });
    }),
    http.patch(OPT_IN_PATH, async ({ request }) => {
      await delay(networkDelay);
      options.onOptIn?.(await request.json());
      return HttpResponse.json({ errors: [{ detail: 'Opt-in is not possible.', status: '422' }] }, { status: 422 });
    }),
  ];
}

/**
 * Tenant is eligible, but the opt-in PATCH is rejected with an RBAC error envelope.
 */
export function tenantOptInErrorHandlers(status: number = 403, detail: string = 'You do not have permission to perform this action.') {
  return [
    http.get(OPT_IN_PATH, async () => {
      await delay(MOCK_DELAY);
      return HttpResponse.json<TenantOptInResponse>({ v2_opted_in: false });
    }),
    http.get(`${OPT_IN_PATH}eligibility/`, async () => {
      await delay(MOCK_DELAY);
      return HttpResponse.json<TenantOptInEligibility>({ eligible: true });
    }),
    http.patch(OPT_IN_PATH, async () => {
      await delay(MOCK_DELAY);
      return HttpResponse.json({ errors: [{ detail, source: 'detail', status: String(status) }] }, { status });
    }),
  ];
}
