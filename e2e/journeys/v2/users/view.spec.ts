/**
 * V2 Users - View Tests
 *
 * Tests for viewing and filtering users on the V2 Users page.
 * Users are managed externally (SSO), so these are read-only operations.
 *
 * Personas: OrgAdmin, UserAdmin, UserViewer
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_USERADMIN, AUTH_V2_USERVIEWER, getAdminUsername } from '../../../utils';
import { UsersPage } from '../../../pages/v2/UsersPage';

// Get the username we're logged in as (for filtering tests)
const LOGGED_IN_USERNAME = getAdminUsername();

// ═══════════════════════════════════════════════════════════════════════════
// Persona definitions
// ═══════════════════════════════════════════════════════════════════════════

const viewPersonas = [
  { name: 'OrgAdmin', auth: AUTH_V2_ADMIN },
  { name: 'UserAdmin', auth: AUTH_V2_USERADMIN },
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
      test.skip(!LOGGED_IN_USERNAME, 'RBAC_USERNAME not set - cannot verify filtering');

      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Filter by logged-in user
      await usersPage.filterByUsername(LOGGED_IN_USERNAME!);
      await expect(usersPage.getUserRow(LOGGED_IN_USERNAME!)).toBeVisible({ timeout: 10000 });

      // Clear filter
      await usersPage.clearFilter();
      await expect(usersPage.table).toBeVisible();
    });

    test(`Can view user details in drawer [${name}]`, async ({ page }) => {
      test.skip(!LOGGED_IN_USERNAME, 'RBAC_USERNAME not set - cannot verify drawer');

      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Search and open drawer
      await usersPage.filterByUsername(LOGGED_IN_USERNAME!);
      await usersPage.openUserDrawer(LOGGED_IN_USERNAME!);

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
      await usersPage.closeUserDrawer(LOGGED_IN_USERNAME!);
    });
  });
});
