/**
 * V2 Roles - View Tests
 *
 * Tests for viewing roles on the V2 Roles page.
 *
 * Personas: Admin
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN } from '../../../utils';
import { RolesPage } from '../../../pages/v2/RolesPage';
import { getSeededRoleName } from '../../../utils/seed-map';

const SEEDED_ROLE_NAME = getSeededRoleName('v2');

if (!SEEDED_ROLE_NAME) {
  throw new Error('No seeded role found in seed map. Run: npm run e2e:seed:v2');
}

// ═══════════════════════════════════════════════════════════════════════════
// Admin - Full Access
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin', () => {
  test.use({ storageState: AUTH_V2_ADMIN });

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

  test(`Can view role details in drawer [Admin]`, async ({ page }) => {
    const rolesPage = new RolesPage(page);
    await rolesPage.goto();

    await rolesPage.searchFor(SEEDED_ROLE_NAME);
    await rolesPage.openDrawer(SEEDED_ROLE_NAME);

    // Verify drawer content
    await expect(page.getByRole('heading', { name: SEEDED_ROLE_NAME, level: 2 })).toBeVisible();

    await rolesPage.closeDrawer(SEEDED_ROLE_NAME);
  });
});
