/**
 * V2 Roles - View Tests
 *
 * Tests for viewing roles on the V2 Roles page.
 *
 * Personas: Admin, UserViewer
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_USERVIEWER } from '../../../utils';
import { RolesPage } from '../../../pages/v2/RolesPage';
import { getSeededRoleName } from '../../../utils/seed-map';

const SEEDED_ROLE_NAME = getSeededRoleName('v2');

if (!SEEDED_ROLE_NAME) {
  throw new Error('No seeded role found in seed map. Run: npm run e2e:seed:v2');
}

// ═══════════════════════════════════════════════════════════════════════════
// Personas
// ═══════════════════════════════════════════════════════════════════════════

const viewPersonas = [
  { name: 'Admin', auth: AUTH_V2_ADMIN },
  { name: 'UserViewer', auth: AUTH_V2_USERVIEWER },
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

    test(`Can view role details in drawer [${name}]`, async ({ page }) => {
      const rolesPage = new RolesPage(page);
      await rolesPage.goto();

      await rolesPage.searchFor(SEEDED_ROLE_NAME);
      await rolesPage.openDrawer(SEEDED_ROLE_NAME);

      // Verify drawer content
      await expect(page.getByRole('heading', { name: SEEDED_ROLE_NAME, level: 2 })).toBeVisible();

      await rolesPage.closeDrawer(SEEDED_ROLE_NAME);
    });
  });
});
