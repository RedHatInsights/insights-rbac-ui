/**
 * User List Tests
 *
 * Tests for viewing and filtering users on the V2 Users page.
 * Users are managed externally (SSO), so these are read-only operations.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It tests table visibility or structure
 *   ✓ It tests search/filter functionality
 *   ✓ It tests sorting or pagination
 *   ✓ It views user details in drawer
 *
 * DO NOT add here if:
 *   ✗ It invites users → user-invite.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View Users List, Search Users, Filter Users, View User Detail
 * @personas
 *   - Admin: Full list access
 *   - UserViewer: Full list access (can see users but not manage)
 *   - ReadOnlyUser: Page blocked entirely (unauthorized message)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ORGADMIN, AUTH_V2_USERVIEWER, AUTH_V2_READONLY from utils
 *   - DATA: Uses getSeededUsername() from seed fixture
 *   - UTILS: Use UsersPage for table and drawer interactions
 */

import { expect, test } from '@playwright/test';
import {
  AUTH_V2_ORGADMIN,
  AUTH_V2_RBACADMIN,
  AUTH_V2_READONLY,
  AUTH_V2_USERVIEWER,
  AUTH_V2_WORKSPACEUSER,
  getSeededUsername,
  iamUrl,
  setupPage,
  v2,
} from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { UsersPage } from '../../../pages/v2/UsersPage';
import { NavigationSidebar } from '../../../pages/v2/NavigationSidebar';

// Get known seeded username from seed fixture (for filter/search tests)
const KNOWN_USERNAME = getSeededUsername(0, 'v2');
const USERS_URL = iamUrl(v2.usersNew.link());

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('User List', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full list access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test(`Can view users list [OrgAdmin]`, async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Verify table structure
      await expect(usersPage.table).toBeVisible();
      await expect(usersPage.usernameColumn).toBeVisible();
      await expect(usersPage.emailColumn).toBeVisible();
      await expect(usersPage.statusColumn).toBeVisible();
    });

    test(`Can filter users by username [OrgAdmin]`, async ({ page }) => {
      test.skip(!KNOWN_USERNAME, 'Seeded username not configured in seed fixture');

      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Filter by known admin user
      await usersPage.filterByUsername(KNOWN_USERNAME!);
      await expect(usersPage.getUserRow(KNOWN_USERNAME!)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      // Clear filter
      await usersPage.clearFilter();
      await expect(usersPage.table).toBeVisible();
    });

    test(`Can view user details in drawer [OrgAdmin]`, async ({ page }) => {
      test.skip(!KNOWN_USERNAME, 'Seeded username not configured in seed fixture');

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

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Bulk Actions
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('OrgAdmin - Bulk Actions', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Can select users for bulk action [OrgAdmin]', async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Select a user via checkbox
      const table = page.getByRole('grid');
      const checkboxes = table.locator('tbody input[type="checkbox"]');
      const count = await checkboxes.count();
      if (count > 0) {
        await checkboxes.first().click();

        // Verify bulk action toolbar appears (Add to user group)
        const addToGroupButton = page.getByRole('button', { name: /add to user group/i });
        await expect(addToGroupButton).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - Full list access (can see users but not manage)
  // ═══════════════════════════════════════════════════════════════════════════
  //
  // NOTE: UserViewer passes the route guard (rbac:principal:read OR rbac:group:read)
  // via rbac:group:read, but the Users sub-tab fetches the principals API which
  // returns 403 for this persona. The ApiErrorBoundary catches the 403 and replaces
  // the page with UnauthorizedAccess. The "list" test is a false positive (assertions
  // pass before the error boundary triggers). All three tests are fixme'd until the
  // route guard is tightened or UserViewer gets rbac:principal:read.
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test.fixme(`Can view users list [UserViewer]`, async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Verify table structure
      await expect(usersPage.table).toBeVisible();
      await expect(usersPage.usernameColumn).toBeVisible();
      await expect(usersPage.emailColumn).toBeVisible();
      await expect(usersPage.statusColumn).toBeVisible();
    });

    test.fixme(`Can filter users by username [UserViewer]`, async ({ page }) => {
      test.skip(!KNOWN_USERNAME, 'Seeded username not configured in seed fixture');

      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Filter by known admin user
      await usersPage.filterByUsername(KNOWN_USERNAME!);
      await expect(usersPage.getUserRow(KNOWN_USERNAME!)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      // Clear filter
      await usersPage.clearFilter();
      await expect(usersPage.table).toBeVisible();
    });

    test.fixme(`Can view user details in drawer [UserViewer]`, async ({ page }) => {
      test.skip(!KNOWN_USERNAME, 'Seeded username not configured in seed fixture');

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

  // ═══════════════════════════════════════════════════════════════════════════
  // READONLYUSER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════
  // Add "unauthorized message" tests here
  // These tests should navigate to URL and verify blocked access

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V2_READONLY });

    test(`Users page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
      test.fixme(true, 'APP BUG: ReadOnlyUser navigating to users URL sees My User Access instead of UnauthorizedAccess page');
      await setupPage(page);
      await page.goto(USERS_URL);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });

    test(`Admin-only navigation links should not be visible [ReadOnlyUser]`, async ({ page }) => {
      await setupPage(page);
      await page.goto(iamUrl(v2.myAccess.link()));
      await expect(page).toHaveURL(/\/iam\/my-user-access/);

      // Wait for navigation to render
      await page.waitForTimeout(E2E_TIMEOUTS.DRAWER_ANIMATION);

      // ReadOnlyUser should see My Access page but not admin nav links
      const navSidebar = new NavigationSidebar(page);
      await expect(navSidebar.getNavExpandable(NavigationSidebar.NAV_ACCESS_MANAGEMENT)).not.toBeVisible();
    });
  });

  test.describe('WorkspaceUser', () => {
    test.use({ storageState: AUTH_V2_WORKSPACEUSER });

    test('Users page shows unauthorized access [WorkspaceUser]', async ({ page }) => {
      await setupPage(page);
      await page.goto(USERS_URL);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RBACADMIN - rbac:: write perms, not org admin; full list access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('RbacAdmin', () => {
    test.use({ storageState: AUTH_V2_RBACADMIN });

    test('Can view users list [RbacAdmin]', async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();
      await expect(usersPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    });

    test('Can filter users by username [RbacAdmin]', async ({ page }) => {
      const seededUsername = getSeededUsername(0, 'v2');
      if (seededUsername) {
        const usersPage = new UsersPage(page);
        await usersPage.goto();
        await usersPage.filterByUsername(seededUsername);
        await expect(usersPage.getUserRow(seededUsername)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      }
    });
  });
});
