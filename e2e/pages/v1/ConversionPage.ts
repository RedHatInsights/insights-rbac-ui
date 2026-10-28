/**
 * Page Object for the V2 conversion opt-in banner and wizard.
 *
 * The banner renders on two surfaces and the component is identical in both:
 *   - RBAC Overview      /iam/user-access/overview   (gated in OverviewContent.tsx)
 *   - Console landing    /                           (the ConversionOptInBanner
 *                                                     federated module, Chrome-owned)
 *
 * ─── SAFETY ─────────────────────────────────────────────────────────────────────
 * Submitting the wizard converts the tenant, and conversion is irreversible once the
 * org performs a V2 write. A single stray submit burns the standing test org and
 * disables the whole non-destructive suite until a replacement is provisioned.
 *
 * `blockOptInWrite()` is therefore mandatory in every test that can reach the wizard.
 * `submitButton` exists only so tests can assert its state — never click it.
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { iamUrl, setupPage, v1, v2 } from '../../utils';
import { E2E_TIMEOUTS } from '../../utils/timeouts';

const V1_OVERVIEW_URL = iamUrl(v1.overview.link());
const V2_OVERVIEW_URL = iamUrl(v2.overview.link());
const LANDING_PAGE_URL = '/';

/** The Unleash toggle gating the banner. Must match `src/capabilities/useConversionOptIn.ts`. */
export const CONVERSION_FLAG = 'platform.conversion.opt-in-banner';

/** Copy owned by `src/Messages.js`. */
export const BANNER_TITLE = 'Elevate your infrastructure with workspace-based access management';
export const BANNER_BODY = /Organize your RHEL systems into workspaces with hierarchical permission control/;
export const GET_STARTED = 'Get started now';
export const LEARN_MORE = 'Learn more about the benefits';

/** The wizard modal's accessible name — see `src/v1/components/conversion-wizard/schema.tsx`. */
export const WIZARD_TITLE = 'Convert to workspace-based access management';

/** Wizard step headings, in order. */
export const WIZARD_STEPS = ['What changes during conversion', 'Post-conversion requirements', 'Pre-conversion checklist', 'Confirm conversion'];

/**
 * Safety rail 1 — abort the opt-in write so a stray click cannot convert the tenant.
 *
 * PATCH only. The status read (`GET /tenant/opt-in/`) shares this path and the wizard's
 * pre-flight check (`GET /tenant/opt-in/eligibility/`) sits beneath it; aborting either
 * would break the flow under test rather than protect it.
 */
export async function blockOptInWrite(page: Page): Promise<void> {
  await page.route('**/api/rbac/v1/tenant/opt-in/**', async (route, request) => {
    if (request.method() === 'PATCH') {
      console.error(`[SAFETY RAIL] Blocked a PATCH to ${request.url()} — a test tried to convert the tenant.`);
      return route.abort();
    }
    return route.fallback();
  });
}

type UnleashToggle = { name: string; enabled: boolean };

/**
 * Captures the toggles Chrome itself fetched from Unleash.
 *
 * Must be called BEFORE navigating. Reading the proxy directly with `page.request` does not
 * work — it answers 401, because the endpoint wants the bearer token and `x-unleash-auth`
 * header that the shell attaches. Observing the shell's own response is both the only thing
 * that works and the more faithful check: it is literally what the application saw.
 */
export function captureFeatureFlags(page: Page): () => UnleashToggle[] | null {
  let toggles: UnleashToggle[] | null = null;

  page.on('response', async (response) => {
    if (!response.url().includes('/api/featureflags/v0') || response.request().method() !== 'GET') return;

    try {
      const body = (await response.json()) as { toggles?: UnleashToggle[] };
      if (body?.toggles) toggles = body.toggles;
    } catch {
      // Not every response on this path carries a JSON body; keep whatever we already have.
    }
  });

  return () => toggles;
}

/**
 * Asserts the conversion flag is actually enabled in Unleash for this org.
 *
 * This separates "the key in the code is wrong" from "the flag is switched off here" — two
 * states that look identical in the browser. A missing toggle means the key does not exist
 * in Unleash at all; a present-but-disabled toggle means the environment is not set up.
 */
export function expectConversionFlagEnabled(toggles: UnleashToggle[] | null): void {
  expect(toggles, 'Never observed a feature-flag response from Chrome. The page may not have loaded.').not.toBeNull();

  const toggle = toggles?.find((t) => t.name === CONVERSION_FLAG);

  expect(
    toggle,
    `"${CONVERSION_FLAG}" does not exist in Unleash for this org. ` +
      `If the application requests a name Unleash does not have, the flag library returns false ` +
      `and the banner silently never renders — check src/capabilities/useConversionOptIn.ts.`,
  ).toBeDefined();

  expect(toggle?.enabled, `"${CONVERSION_FLAG}" exists in Unleash but is DISABLED for this org, so the banner cannot render.`).toBe(true);
}

export class ConversionPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  /** V1 User Access Overview — the banner is gated here by OverviewContent.tsx. */
  async gotoOverview(): Promise<void> {
    // The V1 overview page titles itself "User Access", not "Overview".
    await this.gotoOverviewUrl(V1_OVERVIEW_URL, /user access/i);
  }

  /** V2 Access Management Overview — where an org already on V2 lands. */
  async gotoV2Overview(): Promise<void> {
    await this.gotoOverviewUrl(V2_OVERVIEW_URL, /access management/i);
  }

  private async gotoOverviewUrl(url: string, heading: RegExp): Promise<void> {
    await setupPage(this.page);
    await this.page.goto(url, { timeout: E2E_TIMEOUTS.SLOW_DATA });
    await expect(this.page.getByRole('heading', { name: heading, level: 1 }).first()).toBeVisible({
      timeout: E2E_TIMEOUTS.DETAIL_CONTENT,
    });
  }

  /** Console landing page — the banner arrives as a federated module from this app. */
  async gotoLandingPage(): Promise<void> {
    await setupPage(this.page);
    await this.page.goto(LANDING_PAGE_URL, { timeout: E2E_TIMEOUTS.SLOW_DATA });
    await expect(this.page.getByRole('button', { name: /add widgets/i })).toBeVisible({
      timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Banner locators
  //
  // PatternFly renders `variant="custom"` alerts without role="alert", and prefixes the
  // title's accessible name with "Custom alert:" — hence the regex rather than an exact
  // name match.
  // ═══════════════════════════════════════════════════════════════════════════

  get bannerHeading(): Locator {
    return this.page.getByRole('heading', { name: new RegExp(BANNER_TITLE) });
  }

  get bannerBody(): Locator {
    return this.page.getByText(BANNER_BODY);
  }

  get getStartedButton(): Locator {
    return this.page.getByRole('button', { name: GET_STARTED });
  }

  get learnMoreLink(): Locator {
    return this.page.getByRole('link', { name: new RegExp(LEARN_MORE) });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Wizard locators
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * The wizard renders two nested `role="dialog"` elements — PatternFly's modal box and the
   * data-driven-forms wizard inside it — so a bare getByRole('dialog') is ambiguous. The
   * modal box is the one carrying the wizard's accessible name.
   */
  get wizard(): Locator {
    return this.page.getByRole('dialog', { name: WIZARD_TITLE, exact: true });
  }

  stepHeading(name: string): Locator {
    return this.wizard.getByRole('heading', { name, exact: true });
  }

  get nextButton(): Locator {
    return this.wizard.getByRole('button', { name: 'Next', exact: true });
  }

  get cancelButton(): Locator {
    return this.wizard.getByRole('button', { name: 'Cancel', exact: true });
  }

  /**
   * Safety rail 2 — exact accessible name, never a loose regex like /next|submit/i.
   *
   * Provided for asserting state only. Clicking this converts the tenant.
   */
  get submitButton(): Locator {
    return this.wizard.getByRole('button', { name: 'Submit', exact: true });
  }

  get checklistCheckboxes(): Locator {
    return this.wizard.getByRole('checkbox');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyBannerVisible(): Promise<void> {
    await expect(this.bannerHeading).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    await expect(this.bannerBody).toBeVisible();
    await expect(this.getStartedButton).toBeVisible();
    await expect(this.learnMoreLink).toBeVisible();
  }

  async verifyBannerAbsent(): Promise<void> {
    await expect(this.bannerHeading).toHaveCount(0);
    await expect(this.getStartedButton).toHaveCount(0);
  }

  async openWizard(): Promise<void> {
    await this.getStartedButton.click();
    await expect(this.wizard).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
    await expect(this.stepHeading(WIZARD_STEPS[0])).toBeVisible();
  }

  /** Advance one step. Only valid where the current step has no outstanding validation. */
  async clickNext(): Promise<void> {
    await expect(this.nextButton).toBeEnabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE });
    await this.nextButton.click();
  }

  async checkAllChecklistBoxes(): Promise<void> {
    const boxes = this.checklistCheckboxes;
    const count = await boxes.count();

    for (let i = 0; i < count; i++) {
      await boxes.nth(i).check();
    }
  }

  /** Safety rail 3 — every test that opens the wizard exits this way, closure asserted. */
  async cancelWizard(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.wizard).toBeHidden({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
  }
}
