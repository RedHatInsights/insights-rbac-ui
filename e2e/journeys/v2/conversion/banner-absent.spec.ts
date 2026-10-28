/**
 * V2 Conversion Opt-In - Banner absent for an org already on V2
 *
 * Covers RHCLOUD-52134 case D12. Lives on the V2 side because it needs an org that is
 * already in the V2 experience; the rest of the conversion suite is in
 * journeys/v1/conversion/conversion-banner.spec.ts.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 * ✓ It asserts the conversion banner is absent for an org already on V2
 *
 * DO NOT add here if:
 * ✗ The org is pre-conversion → journeys/v1/conversion/conversion-banner.spec.ts
 * ✗ It performs the opt-in → the destructive tier, RHCLOUD-52135
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS (see TEST_PERSONAS.md)
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability conversion-opt-in-banner
 *
 * @personas
 * - OrgAdmin (V2): org admin already in the V2 experience
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 * - AUTH: AUTH_V2_ORGADMIN
 * - UTILS: ConversionPage (e2e/pages/v1/ConversionPage.ts)
 *
 * Coverage note: the shell renders V2 when the access-management flag is on OR the tenant
 * has opted in. This covers the flag-enabled route only, because no stage org has reached
 * V2 by actually opting in. The opted-in route stays uncovered until such an org exists.
 */

import { test } from '@playwright/test';
import { AUTH_V2_ORGADMIN } from '../../../utils';
import { ConversionPage, blockOptInWrite } from '../../../pages/v1/ConversionPage';

test.describe('Conversion Opt-In Banner - already on V2', () => {
  test.use({ storageState: AUTH_V2_ORGADMIN });

  test.beforeEach(async ({ page }) => {
    // This org should never reach the wizard, so a PATCH here would mean something is
    // badly wrong. Blocked anyway — the rail is unconditional across the suite.
    await blockOptInWrite(page);
  });

  /**
   * D12. An org already on V2 must never be invited to convert again, on either surface.
   */
  test('Banner is absent on both surfaces for an org on V2 [OrgAdmin]', async ({ page }) => {
    const conversion = new ConversionPage(page);

    await test.step('Access Management overview shows no conversion banner', async () => {
      await conversion.gotoV2Overview();
      await conversion.verifyBannerAbsent();
    });

    await test.step('Console landing page shows no conversion banner', async () => {
      await conversion.gotoLandingPage();
      await conversion.verifyBannerAbsent();
    });
  });
});
