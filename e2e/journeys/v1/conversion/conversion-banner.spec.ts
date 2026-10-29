/**
 * V2 Conversion Opt-In - Banner & Wizard (non-destructive)
 *
 * Covers RHCLOUD-52134 cases D1, D2, D6, D7, D10 against stage, up to but never
 * including submission.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 * ✓ It needs a real value that crosses a process boundary — the actual Unleash flag
 *   key, real federated-module loading, real SVG/font assets
 * ✓ It exercises the banner or wizard without submitting
 *
 * DO NOT add here if:
 * ✗ It re-tests gating logic Storybook already covers deterministically and far more
 *   cheaply (checklist gating, submit gating, reset-on-reopen — see B6, B11, B14)
 * ✗ It performs the opt-in → that is the destructive tier, RHCLOUD-52135
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * SAFETY — these are infrastructure, not precautions
 * ═══════════════════════════════════════════════════════════════════════════════
 * Submitting the wizard converts the tenant. A single stray submit burns the standing
 * test org and disables this whole suite until a replacement is provisioned.
 *
 * 1. `blockOptInWrite()` aborts the opt-in PATCH in every test, so a stray click cannot
 *    convert even if a test is wrong. The status GET and the eligibility GET share that
 *    path prefix and deliberately pass through.
 * 2. The submit control is located by exact accessible name, never /next|submit/i.
 * 3. Every test that opens the wizard ends by cancelling, with closure asserted.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS (see TEST_PERSONAS.md)
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability conversion-opt-in-banner, conversion-wizard
 *
 * @personas
 * - ConversionOrgAdmin: org admin of a standing org eligible to convert, NOT opted in
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 * - AUTH: AUTH_V1_CONVERSION
 * - ENV: `platform.conversion.opt-in-banner` enabled in Unleash for this org
 * - UTILS: ConversionPage (e2e/pages/v1/ConversionPage.ts)
 *
 * Not covered, both blocked upstream:
 * - D3 (non-admin variant) — the variant is not implemented; the banner renders nothing
 *   for non-admins today, and it needs a non-admin persona in the same org (RHCLOUD-51470).
 * - D13 (landing-page "Get started") — Chrome has not defined what the callback does, and
 *   the wizard is not exposed as a federated module, so the button may do nothing at all.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_CONVERSION } from '../../../utils';
import { ConversionPage, WIZARD_STEPS, blockOptInWrite, captureFeatureFlags, expectConversionFlagEnabled } from '../../../pages/v1/ConversionPage';

test.describe('Conversion Opt-In Banner & Wizard', () => {
  test.use({ storageState: AUTH_V1_CONVERSION });

  test.beforeEach(async ({ page }) => {
    await blockOptInWrite(page);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // D1 — Banner on RBAC Overview, and the flag-key regression guard
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * D1. Also the flag-key regression guard, which is why it asserts against Unleash first.
   *
   * If the string the app requests does not exactly match the flag configured in Unleash,
   * the flag library returns false and the banner silently never appears — no error, nothing
   * in the console. Storybook structurally cannot catch this: the stories mock the same
   * constant the hook reads, so a wrong key is wrong in both places and every story stays
   * green.
   *
   * A failure on the banner assertion here, with the Unleash assertion passing, means the
   * KEY IS WRONG — check src/capabilities/useConversionOptIn.ts before anything else.
   */
  test('Banner appears on the RBAC Overview page [ConversionOrgAdmin]', async ({ page }) => {
    // Attached before navigating: this reads the flags Chrome itself fetched, which is both
    // the only thing the proxy will answer and exactly what the application acted on.
    const featureFlags = captureFeatureFlags(page);

    const conversion = new ConversionPage(page);
    await conversion.gotoOverview();

    expectConversionFlagEnabled(featureFlags());
    await conversion.verifyBannerVisible();

    // A8 covers href/target/rel deterministically in Storybook; resolving the URL from CI
    // is a flaky network dependency, so this only asserts link safety.
    await expect(conversion.learnMoreLink).toHaveAttribute('target', '_blank');
    await expect(conversion.learnMoreLink).toHaveAttribute('rel', /noopener/);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // D2 — Banner on the console landing page (federated module path)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * D2. This is the module-federation path. A failure here while D1 passes points at module
   * federation or consumer-side gating, not at the banner.
   */
  test('Banner appears on the console landing page [ConversionOrgAdmin]', async ({ page }) => {
    const conversion = new ConversionPage(page);
    await conversion.gotoLandingPage();

    // Identical in content to the Overview instance — same component, different consumer.
    await conversion.verifyBannerVisible();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // D6 — "Get started now" opens the wizard
  // ═══════════════════════════════════════════════════════════════════════════

  /** D6. Overview surface only — the landing-page equivalent is D13, which is blocked. */
  test('Get started now opens the conversion wizard [ConversionOrgAdmin]', async ({ page }) => {
    const conversion = new ConversionPage(page);
    await conversion.gotoOverview();

    await conversion.openWizard();
    await expect(conversion.stepHeading(WIZARD_STEPS[0])).toBeVisible();

    await conversion.cancelWizard();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // D7 — Traverse all four steps against the real application
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * D7. Verifies the SVG diagrams and fonts actually ship, which mocked tests cannot.
   *
   * Checklist gating is exercised implicitly: step 3 cannot be traversed without checking
   * all four boxes. Asserting the gate directly duplicates B6 with no boundary crossed.
   *
   * Under no circumstances may this test click Submit.
   */
  test('Wizard traverses all four steps [ConversionOrgAdmin]', async ({ page }) => {
    const conversion = new ConversionPage(page);
    await conversion.gotoOverview();
    await conversion.openWizard();

    await test.step('Step 1 — Introduction renders its real assets', async () => {
      await expect(conversion.stepHeading(WIZARD_STEPS[0])).toBeVisible();

      // Real images, served from the deployed bundle rather than a mock.
      // `exact` matters here: "Workspace hierarchy diagram" is a substring of
      // "Permissions and workspace hierarchy diagram", and name matching is substring
      // by default, so without it the first lookup matches two images.
      for (const alt of ['Workspace hierarchy diagram', 'Permissions and workspace hierarchy diagram', 'Role bindings example diagram']) {
        await expect(conversion.wizard.getByRole('img', { name: alt, exact: true })).toBeVisible();
      }

      await conversion.clickNext();
    });

    await test.step('Step 2 — Post-conversion requirements', async () => {
      await expect(conversion.stepHeading(WIZARD_STEPS[1])).toBeVisible();
      await conversion.clickNext();
    });

    await test.step('Step 3 — Pre-conversion checklist', async () => {
      await expect(conversion.stepHeading(WIZARD_STEPS[2])).toBeVisible();
      await expect(conversion.checklistCheckboxes).toHaveCount(4);

      await conversion.checkAllChecklistBoxes();
      await conversion.clickNext();
    });

    await test.step('Step 4 — Confirm conversion, without submitting', async () => {
      await expect(conversion.stepHeading(WIZARD_STEPS[3])).toBeVisible();

      // The permanence warning must not be dismissible.
      const permanenceWarning = conversion.wizard.getByText('Conversion is permanent');
      await expect(permanenceWarning).toBeVisible();

      // Submit is located only to assert it exists and is gated. Never clicked.
      await expect(conversion.submitButton).toBeDisabled();
    });

    await conversion.cancelWizard();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // D10 — Cancelling preserves the banner, on both surfaces
  // ═══════════════════════════════════════════════════════════════════════════

  /** D10. The user must be able to start again after backing out. */
  test('Cancelling the wizard preserves the banner on Overview [ConversionOrgAdmin]', async ({ page }) => {
    const conversion = new ConversionPage(page);
    await conversion.gotoOverview();

    await conversion.openWizard();
    await conversion.cancelWizard();

    await expect(conversion.bannerHeading).toBeVisible();
    await expect(conversion.getStartedButton).toBeEnabled();
  });

  /**
   * D10, landing-page half. Scoped to what is provable today: the banner survives a visit.
   * Opening the wizard from here is D13, which is blocked — the wizard is not exposed as a
   * federated module, so "Get started now" cannot open it the way Overview does.
   */
  test('Banner remains available on the landing page [ConversionOrgAdmin]', async ({ page }) => {
    const conversion = new ConversionPage(page);
    await conversion.gotoLandingPage();

    await expect(conversion.bannerHeading).toBeVisible();
    await expect(conversion.getStartedButton).toBeEnabled();
  });
});
