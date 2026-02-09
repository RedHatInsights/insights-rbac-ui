/**
 * V1 Roles - View Tests
 *
 * Tests for viewing roles on the V1 Roles page.
 *
 * Personas: Admin
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN } from '../../../utils';
import { RolesPage } from '../../../pages/v1/RolesPage';
import { getSeededRoleData, getSeededRoleName } from '../../../utils/seed-map';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const SEEDED_ROLE_NAME = getSeededRoleName('v1');
const SEEDED_ROLE_DATA = getSeededRoleData();

if (!SEEDED_ROLE_NAME) {
  throw new Error('No seeded role found in seed map. Run: npm run e2e:seed:v1');
}

// ═══════════════════════════════════════════════════════════════════════════
// Admin - Full Access
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin', () => {
  test.use({ storageState: AUTH_V1_ADMIN });

  test(`Can view roles list [Admin]`, async ({ page }) => {
    const rolesPage = new RolesPage(page);
    await rolesPage.goto();

    await expect(rolesPage.table).toBeVisible();
  });

  test(`Can search for seeded role [Admin]`, async ({ page }) => {
    const rolesPage = new RolesPage(page);
    await rolesPage.goto();

    await rolesPage.searchFor(SEEDED_ROLE_NAME);
    await rolesPage.verifyRoleInTable(SEEDED_ROLE_NAME);
  });

  test(`Can view role detail page [Admin]`, async ({ page }) => {
    const rolesPage = new RolesPage(page);
    await rolesPage.goto();

    await rolesPage.searchFor(SEEDED_ROLE_NAME);
    await rolesPage.navigateToDetail(SEEDED_ROLE_NAME);

    // Verify detail page
    await expect(rolesPage.getDetailHeading(SEEDED_ROLE_NAME)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });

    // Verify description if available
    if (SEEDED_ROLE_DATA?.description) {
      await expect(page.getByText(SEEDED_ROLE_DATA.description)).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
    }

    // Verify permissions grid
    await expect(rolesPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  });
});
