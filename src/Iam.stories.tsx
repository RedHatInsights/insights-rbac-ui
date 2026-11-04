import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor, within } from 'storybook/test';
import { Iam } from './Iam';
import { TEST_TIMEOUTS } from './test-utils/testUtils';
import { getSkeletonCount, queryAppRoot, queryByOuiaId } from './test-utils/interactionHelpers';
import { resetStoryState } from './user-journeys/_shared/helpers';
import { createV1MockDb } from './v1/data/mocks/db';
import { createV1Handlers } from './v1/data/mocks/handlers';
import { defaultV1Seed } from './v1/data/mocks/seed';
import { createV2MockDb } from './v2/data/mocks/db';
import { createV2Handlers } from './v2/data/mocks/handlers';
import { defaultV2Seed } from './v2/data/mocks/seed';
import { tenantOptInStatusErrorHandlers, tenantOptInStatusHandlers, tenantOptInStatusLoadingHandlers } from './v1/data/mocks/tenant.handlers';

// ---------------------------------------------------------------------------
// What these stories pin down
// ---------------------------------------------------------------------------
//
// `VersionRouter` in Iam.tsx picks V1 or V2 from EITHER the access-management feature flag OR
// the tenant's opt-in status, because the two can legitimately disagree: the flag rolls out per
// environment, conversion happens per tenant and is irreversible. The stories below mount the
// real shell — the same provider stack production uses, including `ApiErrorBoundary` — and
// drive each input combination from the outside: the flag through `parameters.featureFlags`,
// the opt-in status through MSW.
//
// Mounting at `/iam/` makes the two versions self-identify without picking a side: neither
// version has a route for it, so each falls through to its own catch-all landing page.
// V1 lands on "My User Access", V2 on "My Access". Whichever heading appears names the version
// that mounted.

/** The route neither version matches, so each one redirects to its own landing page. */
const SHELL_ROUTE = '/iam/';

/** V1's catch-all destination — `/iam/my-user-access`. */
const V1_LANDING = /^my user access$/i;

/** V2's catch-all destination — `/iam/my-access`. */
const V2_LANDING = /^my access$/i;

/** Matches either landing page, for the stories that assert neither version mounted. */
const EITHER_LANDING = /^my (user )?access$/i;

/** The M5 master flag. `useWorkspacesFlag('m5')` is true whenever this is on. */
const WORKSPACES_FLAG = 'platform.rbac.workspaces';

/**
 * How long a story waits before concluding that something will never appear. Long enough for a
 * wrongly mounted IamV1 to resolve Chrome identity and paint its landing page, so the absence
 * assertions cannot pass just because the page had not rendered yet.
 */
const NEVER_APPEARS_WINDOW = TEST_TIMEOUTS.LONG_OPERATION;

const v1Db = createV1MockDb(defaultV1Seed());
const v1Handlers = createV1Handlers(v1Db);

const v2Db = createV2MockDb(defaultV2Seed());
const v2Handlers = createV2Handlers(v2Db);

// One spy per story. The opt-in request count is the assertion in three of these stories, so
// sharing a single spy across them would make a leaked call from one story look like a
// behaviour change in the next.
const optedInStatusSpy = fn();
const flagOnStatusSpy = fn();
const notOptedInStatusSpy = fn();
const serverErrorStatusSpy = fn();
const forbiddenStatusSpy = fn();
const pendingStatusSpy = fn();

/** Every error state the shell can put on screen in place of the app. */
function queryErrorBoundary(canvasElement: HTMLElement): HTMLElement | null {
  return queryByOuiaId(canvasElement, 'UnauthorizedAccess') ?? queryByOuiaId(canvasElement, 'UnavailableContent');
}

const meta = {
  component: Iam,
  title: 'App Shell/Version Routing',
  tags: ['app-shell'],
  args: {
    // Test-friendly QueryClient (no cache, no react-query retry) with error handling still
    // wired to ApiErrorBoundary — see QueryClientSetup.
    testMode: true,
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={[SHELL_ROUTE]}>
        <Routes>
          <Route path="/iam/*" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
  parameters: {
    // Iam brings its own intl/notifications/services/query-client stack; the preview's
    // component wrapper would duplicate it.
    noWrapping: true,
    environment: 'staging',
    permissions: ['rbac:*:*'],
    workspacePermissions: { view: ['*'], edit: ['*'], delete: ['*'], create: ['*'], move: ['*'] },
    userIdentity: {
      org_id: '12510751',
      account_number: '123456',
      internal: { account_id: '123456' },
      user: {
        username: 'test-user',
        email: 'test@redhat.com',
        first_name: 'Test',
        last_name: 'User',
        is_org_admin: true,
      },
      entitlements: {
        insights: { is_entitled: true },
        openshift: { is_entitled: true },
        rhel: { is_entitled: true },
      },
    },
    featureFlags: { [WORKSPACES_FLAG]: false },
    docs: {
      description: {
        component:
          'Version routing in the app shell: which of IamV1 / IamV2 mounts for each combination of the access-management feature flag and the tenant opt-in status.',
      },
    },
  },
} satisfies Meta<typeof Iam>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * F1 — the case the feature flag alone cannot cover. Conversion is per-tenant and
 * irreversible; the flag is rolled out per environment. A converted tenant left in V1 is
 * broken, because conversion stops the V1 access API from answering and every page denies
 * them, so opt-in has to be sufficient on its own.
 */
export const OptedInTenantGetsV2WithFlagOff: Story = {
  name: 'F1 — Flag off, tenant opted in → V2',
  parameters: {
    featureFlags: { [WORKSPACES_FLAG]: false },
    msw: { handlers: [...tenantOptInStatusHandlers({ optedIn: true, onStatus: optedInStatusSpy }), ...v2Handlers] },
    docs: {
      description: {
        story: `
**Setup:** \`platform.rbac.workspaces\` is **off**; \`GET /api/rbac/v1/tenant/opt-in/\` reports
the tenant as converted.

**Checks:**
- The shell asked for the opt-in status (the flag did not short-circuit it)
- V2 mounted — its landing page is on screen
- V1's landing page is not
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v2Db);
    });

    await step('The shell asks for the opt-in status', async () => {
      await waitFor(() => expect(optedInStatusSpy).toHaveBeenCalled());
    });

    await step('V2 mounted', async () => {
      expect(await canvas.findByRole('heading', { name: V2_LANDING }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).toBeInTheDocument();
      expect(canvas.queryByRole('heading', { name: V1_LANDING })).toBeNull();
    });
  },
};

/**
 * F5 (5xx) — the endpoint fails in a way that might succeed on a second attempt.
 *
 * `useTenantOptInStatusQuery` swallows the failure and reports "not opted in" rather than
 * rejecting. Every other query's errors reach `ApiErrorBoundary` through the QueryCache, where
 * a 5xx replaces the whole app with an error page; this endpoint is not readable by every
 * user, so letting it fail normally would blank the console for them. The retry happens inside
 * `queryFn` for the same reason — rejecting even once would reach `QueryCache.onError` — which
 * is why the shell issues **two** requests here, not one.
 */
export const StatusRequestFailsAppStaysOnV1: Story = {
  name: 'F5 — Opt-in status 500s → V1, no error boundary',
  parameters: {
    featureFlags: { [WORKSPACES_FLAG]: false },
    msw: { handlers: [...tenantOptInStatusErrorHandlers(500, { onStatus: serverErrorStatusSpy }), ...v1Handlers] },
    docs: {
      description: {
        story: `
**Setup:** \`platform.rbac.workspaces\` is **off**; \`GET /api/rbac/v1/tenant/opt-in/\` returns
500 every time.

**Checks:**
- V1 mounted and rendered its landing page — the app is usable
- No \`ApiErrorBoundary\` error page replaced it
- The request was retried once inside \`queryFn\`, so exactly two were issued
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('The app falls back to V1 instead of an error page', async () => {
      expect(await canvas.findByRole('heading', { name: V1_LANDING }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).toBeInTheDocument();
      expect(queryErrorBoundary(canvasElement)).toBeNull();
    });

    await step('The failure was retried inside queryFn, not propagated', async () => {
      await waitFor(() => expect(serverErrorStatusSpy).toHaveBeenCalledTimes(2));
      expect(queryErrorBoundary(canvasElement)).toBeNull();
    });
  },
};

/**
 * F5 (403) — the endpoint refusing to answer for this user is as definitive as a `false`, so
 * `isDefinitiveRefusal` skips the retry. Different branch through `queryFn`, same requirement:
 * V1 renders and the error never reaches the boundary. A user who cannot read this endpoint is
 * exactly the user who would lose the whole console if it did.
 */
export const StatusRequestForbiddenAppStaysOnV1: Story = {
  name: 'F5 — Opt-in status 403s → V1, no retry, no error boundary',
  parameters: {
    featureFlags: { [WORKSPACES_FLAG]: false },
    msw: { handlers: [...tenantOptInStatusErrorHandlers(403, { onStatus: forbiddenStatusSpy }), ...v1Handlers] },
    docs: {
      description: {
        story: `
**Setup:** \`platform.rbac.workspaces\` is **off**; \`GET /api/rbac/v1/tenant/opt-in/\` returns
403 — this user may not read it.

**Checks:**
- V1 mounted and rendered its landing page
- No \`ApiErrorBoundary\` error page replaced it
- A definitive refusal is **not** retried — exactly one request
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('The app falls back to V1 instead of an error page', async () => {
      expect(await canvas.findByRole('heading', { name: V1_LANDING }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).toBeInTheDocument();
      expect(queryErrorBoundary(canvasElement)).toBeNull();
    });

    await step('A 403 is taken as the answer, so nothing is retried', async () => {
      expect(forbiddenStatusSpy).toHaveBeenCalledTimes(1);
    });
  },
};

/**
 * F2 — the ordinary pre-conversion case: nothing is on, nothing has converted, V1 renders.
 */
export const NotOptedInTenantGetsV1: Story = {
  name: 'F2 — Flag off, tenant not opted in → V1',
  parameters: {
    featureFlags: { [WORKSPACES_FLAG]: false },
    msw: { handlers: [...tenantOptInStatusHandlers({ optedIn: false, onStatus: notOptedInStatusSpy }), ...v1Handlers] },
    docs: {
      description: {
        story: `
**Setup:** \`platform.rbac.workspaces\` is **off**; \`GET /api/rbac/v1/tenant/opt-in/\` reports
the tenant as not converted.

**Checks:**
- The shell asked for the opt-in status
- V1 mounted — its landing page is on screen
- V2's landing page is not
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('The shell asks for the opt-in status', async () => {
      await waitFor(() => expect(notOptedInStatusSpy).toHaveBeenCalledTimes(1));
    });

    await step('V1 mounted', async () => {
      expect(await canvas.findByRole('heading', { name: V1_LANDING }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).toBeInTheDocument();
      expect(canvas.queryByRole('heading', { name: V2_LANDING })).toBeNull();
    });
  },
};

/**
 * F3 — the flag is the common path and sits in front of the whole app, so it must not wait on
 * a network round trip. `useTenantOptInStatusQuery` is gated with `enabled: !flagEnabled`;
 * this story proves the gate by counting requests, not by checking that V2 appeared — V2
 * appears either way.
 *
 * The handler answers "not opted in" so that nothing but the gate can be producing the
 * result. The same factory and spy wiring drives F1, where the call *is* recorded, which is
 * what shows the spy here is live rather than simply unattached.
 */
export const FlagOnSkipsTheOptInRequest: Story = {
  name: 'F3 — Flag on → V2, opt-in never requested',
  parameters: {
    featureFlags: { [WORKSPACES_FLAG]: true },
    msw: { handlers: [...tenantOptInStatusHandlers({ optedIn: false, onStatus: flagOnStatusSpy }), ...v2Handlers] },
    docs: {
      description: {
        story: `
**Setup:** \`platform.rbac.workspaces\` is **on**. The opt-in endpoint is registered and would
answer "not converted" — the point is that it is never asked.

**Checks:**
- V2 mounted — its landing page is on screen
- \`GET /api/rbac/v1/tenant/opt-in/\` received **zero** requests
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v2Db);
    });

    await step('V2 mounted', async () => {
      expect(await canvas.findByRole('heading', { name: V2_LANDING }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).toBeInTheDocument();
    });

    await step('The opt-in endpoint was never asked', async () => {
      expect(flagOnStatusSpy).not.toHaveBeenCalled();
    });
  },
};

/**
 * F4 — while the answer is outstanding the shell must commit to neither version. Mounting one
 * and swapping it for the other would throw away whatever the first had already fetched, so
 * the placeholder has to hold until the status resolves.
 */
export const PendingStatusHoldsThePlaceholder: Story = {
  name: 'F4 — Flag off, status still loading → placeholder only',
  parameters: {
    featureFlags: { [WORKSPACES_FLAG]: false },
    // V1 handlers are registered so that a regression shows up as "V1 rendered" rather than as
    // a pile of unhandled requests.
    msw: { handlers: [...tenantOptInStatusLoadingHandlers({ onStatus: pendingStatusSpy }), ...v1Handlers] },
    docs: {
      description: {
        story: `
**Setup:** \`platform.rbac.workspaces\` is **off**; \`GET /api/rbac/v1/tenant/opt-in/\` never
answers.

**Checks:**
- The request was issued, so the shell really is waiting on it
- Neither landing page appears within the window a mounted app would need
- No \`rbac-c-root\` section — neither IamV1 nor IamV2 is mounted
- The \`AppPlaceholder\` skeletons are what is on screen
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('The shell is genuinely waiting on the request', async () => {
      await waitFor(() => expect(pendingStatusSpy).toHaveBeenCalledTimes(1));
    });

    await step('Neither version mounts while the answer is outstanding', async () => {
      // Waiting the full window first is what keeps the two assertions below honest: a shell
      // that had wrongly committed to IamV1 would have resolved Chrome identity and painted
      // "My User Access" well inside it.
      await expect(canvas.findAllByRole('heading', { name: EITHER_LANDING }, { timeout: NEVER_APPEARS_WINDOW })).rejects.toThrow();
      expect(queryAppRoot(canvasElement)).toBeNull();
    });

    await step('The loading placeholder is what is on screen', async () => {
      expect(getSkeletonCount(canvasElement)).toBeGreaterThan(0);
    });
  },
};
