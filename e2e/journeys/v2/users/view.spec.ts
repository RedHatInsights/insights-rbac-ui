/**
 * V2 Users - View Tests
 *
 * Tests for viewing and filtering users on the V2 Users page.
 * Users are managed externally (SSO), so these are read-only operations.
 *
 * Personas: Admin, UserViewer
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_USERVIEWER, getAdminUsername } from '../../../utils';
import { UsersPage } from '../../../pages/v2/UsersPage';

// Get known admin username from seed fixture (for filter/search tests)
const KNOWN_USERNAME = getAdminUsername('v2');

// ═══════════════════════════════════════════════════════════════════════════
// Persona definitions
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

    test(`Can view users list [${name}]`, async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Verify table structure
      await expect(usersPage.table).toBeVisible();
      await expect(usersPage.usernameColumn).toBeVisible();
      await expect(usersPage.emailColumn).toBeVisible();
      await expect(usersPage.statusColumn).toBeVisible();
    });

    test(`Can filter users by username [${name}]`, async ({ page }) => {
      test.skip(!KNOWN_USERNAME, 'Admin username not configured in seed fixture');

      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Filter by known admin user
      await usersPage.filterByUsername(KNOWN_USERNAME!);
      await expect(usersPage.getUserRow(KNOWN_USERNAME!)).toBeVisible({ timeout: 10000 });

      // Clear filter
      await usersPage.clearFilter();
      await expect(usersPage.table).toBeVisible();
    });

    test(`Can view user details in drawer [${name}]`, async ({ page }) => {
      test.skip(!KNOWN_USERNAME, 'Admin username not configured in seed fixture');

      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Search and open drawer for known admin user
      await usersPage.filterByUsername(KNOWN_USERNAME!);
      await usersPage.openUserDrawer(KNOWN_USERNAME!);

      // Verify drawer content
      await expect(usersPage.drawer.getByRole('heading', { level: 2 })).toBeVisible();
      await expect(usersPage.drawer.locator('p').filter({ hasText: /@/ })).toBeVisible();

      // Check tabs
      await expect(usersPage.getDrawerTab('User groups')).toBeVisible();
      await expect(usersPage.getDrawerTab('Assigned roles')).toBeVisible();

      // Navigate tabs
      await usersPage.clickDrawerTab('User groups');
      await usersPage.clickDrawerTab('Assigned roles');

      // Close drawer
      await usersPage.closeUserDrawer(KNOWN_USERNAME!);
    });
  });
});
