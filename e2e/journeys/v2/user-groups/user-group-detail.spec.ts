/**
 * User Group Detail Tests
 *
 * Tests for viewing user group details in drawer.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It views user group detail/drawer content (heading, description)
 *   ✓ It tests drawer open/close behavior
 *   ✓ It tests drawer tab navigation (Users, Service accounts, Assigned roles)
 *   ✓ It navigates from group detail to related entities (e.g. Edit page)
 *
 * DO NOT add here if:
 *   ✗ It creates, edits, or deletes a user group → user-group-management.spec.ts
 *   ✗ It tests the user groups table/list view → user-group-list.spec.ts
 *   ✗ It manages membership (add/remove users) → user-group-membership.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View User Group Detail, Navigate to Related Entities
 * @personas
 *   - Admin: Full detail access, can see Edit button
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ADMIN from utils
 *   - DATA: Relies on SEEDED_GROUP_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use UserGroupsPage for drawer interactions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, getSeededGroupName } from '../../../utils';
import { UserGroupsPage } from '../../../pages/v2/UserGroupsPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const SEEDED_GROUP_NAME = getSeededGroupName('v2');

if (!SEEDED_GROUP_NAME) {
  throw new Error('No seeded group found in seed map. Run: npm run e2e:seed:v2');
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('User Group Detail', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full detail access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test(`Can view group details in drawer [Admin]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.openDrawer(SEEDED_GROUP_NAME);

      // Verify drawer content
      await expect(groupsPage.drawer.getByRole('heading', { name: SEEDED_GROUP_NAME })).toBeVisible();

      await groupsPage.closeDrawer(SEEDED_GROUP_NAME);
    });

    test(`Drawer shows Users, Service accounts, and Assigned roles tabs [Admin]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.openDrawer(SEEDED_GROUP_NAME);

      // Verify all three tabs are visible
      await expect(groupsPage.getDrawerTab('Users')).toBeVisible();
      await expect(groupsPage.getDrawerTab('Service accounts')).toBeVisible();
      await expect(groupsPage.getDrawerTab('Assigned roles')).toBeVisible();

      await groupsPage.closeDrawer(SEEDED_GROUP_NAME);
    });

    test(`Can navigate drawer tabs [Admin]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.openDrawer(SEEDED_GROUP_NAME);

      // Click Users tab (default) - verify table or empty state loads
      await groupsPage.clickDrawerTab('Users');

      // Click Service accounts tab
      await groupsPage.clickDrawerTab('Service accounts');

      // Click Assigned roles tab - the seeded group has "Seeded Role" attached
      await groupsPage.clickDrawerTab('Assigned roles');

      await groupsPage.closeDrawer(SEEDED_GROUP_NAME);
    });

    test(`Drawer Edit button navigates to edit page [Admin]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.openDrawer(SEEDED_GROUP_NAME);

      // Verify Edit button is visible
      await expect(groupsPage.drawerEditButton).toBeVisible();

      // Click Edit and verify navigation to edit page
      await groupsPage.clickDrawerEditButton();

      // Verify we're on the edit page with the form loaded
      await expect(groupsPage.editPageForm).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      await expect(groupsPage.editPageNameInput).toHaveValue(new RegExp(SEEDED_GROUP_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });

    test(`Drawer close button works [Admin]`, async ({ page }) => {
      const groupsPage = new UserGroupsPage(page);
      await groupsPage.goto();

      await groupsPage.searchFor(SEEDED_GROUP_NAME);
      await groupsPage.openDrawer(SEEDED_GROUP_NAME);

      // Close via the X button instead of clicking the row again
      await groupsPage.closeDrawerViaButton();
    });
  });
});
