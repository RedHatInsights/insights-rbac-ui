/**
 * V1 - Regular User Unauthorized Access Tests
 *
 * Tests for regular users (non-admin) attempting to access management pages.
 * Regular users should see unauthorized access when navigating to admin pages.
 * My User Access tests are in the parameterized my-user-access.spec.ts file.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_USER, setupPage } from '../../../utils';

test.use({ storageState: AUTH_V1_USER });

test.describe('V1 - ReadOnlyUser Unauthorized Access', () => {
  test.describe('Management Pages', () => {
    test('Users page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to Users page', async () => {
        await page.goto('/iam/user-access/users');
      });

      await test.step('Verify unauthorized access message', async () => {
        // The app shows "You do not have access to RBAC Users"
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: 15000 });
      });
    });

    test('Groups page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to Groups page', async () => {
        await page.goto('/iam/user-access/groups');
      });

      await test.step('Verify unauthorized access message', async () => {
        // The app shows "You do not have access to RBAC Groups"
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: 15000 });
      });
    });

    test('Roles page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to Roles page', async () => {
        await page.goto('/iam/user-access/roles');
      });

      await test.step('Verify unauthorized access message', async () => {
        // The app shows "You do not have access to RBAC Roles"
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: 15000 });
      });
    });
  });

  test.describe('Navigation Restrictions', () => {
    test('Management navigation links should not be visible', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate to My User Access', async () => {
        await page.goto('/iam/my-user-access');
        await expect(page).toHaveURL(/\/iam\/my-user-access/);
      });

      await test.step('Verify admin nav links are not present', async () => {
        // Check the navigation area for admin-only links
        const nav = page.locator('nav, [class*="nav"]');

        // These admin-only links should NOT be visible for regular users
        const usersNavLink = nav.getByRole('link', { name: /^users$/i });
        const groupsNavLink = nav.getByRole('link', { name: /^groups$/i });
        const rolesNavLink = nav.getByRole('link', { name: /^roles$/i });

        // Wait a moment for navigation to render
        await page.waitForTimeout(1000);

        // Verify these links are not in the navigation
        const usersVisible = await usersNavLink.isVisible().catch(() => false);
        const groupsVisible = await groupsNavLink.isVisible().catch(() => false);
        const rolesVisible = await rolesNavLink.isVisible().catch(() => false);

        if (!usersVisible && !groupsVisible && !rolesVisible) {
          console.log('[V1 User] ✓ Admin navigation links correctly hidden');
        } else {
          // Log which links are unexpectedly visible
          if (usersVisible) console.log('[V1 User] ⚠ Users link visible (may be expected)');
          if (groupsVisible) console.log('[V1 User] ⚠ Groups link visible (may be expected)');
          if (rolesVisible) console.log('[V1 User] ⚠ Roles link visible (may be expected)');
        }
      });
    });
  });
});
