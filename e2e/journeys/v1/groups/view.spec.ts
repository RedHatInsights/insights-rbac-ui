/**
 * V1 Groups - View Tests
 *
 * Tests for viewing groups on the V1 Groups page.
 *
 * Personas: Admin, UserViewer
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN, AUTH_V1_USERVIEWER } from '../../../utils';
import { GroupsPage } from '../../../pages/v1/GroupsPage';
import { getSeededGroupData, getSeededGroupName, getSeededRoleName } from '../../../utils/seed-map';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const SEEDED_GROUP_NAME = getSeededGroupName('v1');
const SEEDED_GROUP_DATA = getSeededGroupData();
const SEEDED_ROLE_NAME = getSeededRoleName('v1');

if (!SEEDED_GROUP_NAME) {
  throw new Error('No seeded group found in seed map. Run: npm run e2e:seed:v1');
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

    test(`Can view groups list [${name}]`, async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await expect(groupsPage.table).toBeVisible();
    });

    test(`Can search for seeded group [${name}]`, async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.verifyGroupInTable(SEEDED_GROUP_NAME);
    });

    test(`Can view group detail page [${name}]`, async ({ page }) => {
      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.navigateToDetail(SEEDED_GROUP_NAME);

      // Verify detail page
      await expect(groupsPage.getDetailHeading(SEEDED_GROUP_NAME)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });

      // Description should appear as subtitle once group data loads
      if (SEEDED_GROUP_DATA?.description) {
        await expect(page.getByText(SEEDED_GROUP_DATA.description)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }

      // Verify tabs
      await expect(groupsPage.membersTab).toBeVisible();
      await expect(groupsPage.rolesTab).toBeVisible();
    });

    test(`Can navigate to attached role from group detail [${name}]`, async ({ page }) => {
      test.skip(!SEEDED_ROLE_NAME, 'No seeded role available');

      const groupsPage = new GroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.navigateToDetail(SEEDED_GROUP_NAME);

      // Navigate to Roles tab
      await groupsPage.clickTab('Roles');

      // Click on the role link
      const roleLink = page.getByRole('grid').getByRole('link', { name: SEEDED_ROLE_NAME! });
      await expect(roleLink).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await roleLink.click();

      // Verify navigated to role detail
      await expect(page).toHaveURL(/\/roles\//, { timeout: E2E_TIMEOUTS.URL_CHANGE });
      await expect(page.getByRole('heading', { name: SEEDED_ROLE_NAME! })).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });
});
