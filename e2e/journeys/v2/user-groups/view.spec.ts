/**
 * V2 User Groups - View Tests
 *
 * Tests for viewing user groups on the V2 User Groups page.
 *
 * Personas: Admin, UserViewer
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_USERVIEWER, getSeededGroupName } from '../../../utils';
import { UserGroupsPage } from '../../../pages/v2/UserGroupsPage';

const SEEDED_GROUP_NAME = getSeededGroupName();

if (!SEEDED_GROUP_NAME) {
  throw new Error('No seeded group found in seed map. Run: npm run e2e:seed:v2');
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

    test(`Can view user groups list [${name}]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await expect(groupsPage.table).toBeVisible();
    });

    test(`Can search for seeded group [${name}]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.verifyGroupInTable(SEEDED_GROUP_NAME);
    });

    test(`Can view group details in drawer [${name}]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.openDrawer(SEEDED_GROUP_NAME);

      // Verify drawer content
      await expect(groupsPage.drawer.getByRole('heading', { name: SEEDED_GROUP_NAME })).toBeVisible();

      await groupsPage.closeDrawer(SEEDED_GROUP_NAME);
    });
  });
});
