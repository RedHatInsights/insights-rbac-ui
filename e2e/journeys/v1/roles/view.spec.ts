/**
 * V1 Roles - View Tests
 *
 * Tests for viewing roles on the V1 Roles page.
 *
 * Personas: Admin, UserViewer
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN, AUTH_V1_USERVIEWER } from '../../../utils';
import { RolesPage } from '../../../pages/v1/RolesPage';
import { getSeededRoleData, getSeededRoleName } from '../../../utils/seed-map';

const SEEDED_ROLE_NAME = getSeededRoleName('v1');
const SEEDED_ROLE_DATA = getSeededRoleData();

if (!SEEDED_ROLE_NAME) {
  throw new Error('No seeded role found in seed map. Run: npm run e2e:seed:v1');
}

// ═══════════════════════════════════════════════════════════════════════════
// Personas
// ═══════════════════════════════════════════════════════════════════════════

const viewPersonas = [
  { name: 'Admin', auth: AUTH_V1_ADMIN },
  { name: 'UserViewer', auth: AUTH_V1_USERVIEWER },
];

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

viewPersonas.forEach(({ name, auth }) => {
  test.describe(name, () => {
    test.use({ storageState: auth });

    test(`Can view roles list [${name}]`, async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await expect(rolesPage.table).toBeVisible();
    });

    test(`Can search for seeded role [${name}]`, async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(SEEDED_ROLE_NAME);
      await rolesPage.verifyRoleInTable(SEEDED_ROLE_NAME);
    });

    test(`Can view role detail page [${name}]`, async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(SEEDED_ROLE_NAME);
      await rolesPage.navigateToDetail(SEEDED_ROLE_NAME);

      // Verify detail page
      await expect(rolesPage.getDetailHeading(SEEDED_ROLE_NAME)).toBeVisible({ timeout: 15000 });

      // Verify description if available
      if (SEEDED_ROLE_DATA?.description) {
        await expect(page.getByText(SEEDED_ROLE_DATA.description)).toBeVisible({ timeout: 30000 });
      }

      // Verify permissions grid
      await expect(rolesPage.table).toBeVisible({ timeout: 10000 });
    });
  });
});
