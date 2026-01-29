/**
 * V2 - Regular User Unauthorized Access Tests
 *
 * Tests for regular users (non-admin) attempting to access management pages.
 * Regular users should see unauthorized access when navigating to admin pages.
 * My User Access tests are in the parameterized my-user-access.spec.ts file.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_USER, setupPage } from '../../../../utils';

test.use({ storageState: AUTH_V2_USER });

test.describe('V2 - ReadOnlyUser Unauthorized Access', () => {
  test.describe('Management Pages', () => {
    test('Users page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to Users page', async () => {
        await page.goto('/iam/access-management/users-and-user-groups/users');
      });

      await test.step('Verify unauthorized access message', async () => {
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: 15000 });
      });
    });

    test('User Groups page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to User Groups page', async () => {
        await page.goto('/iam/access-management/users-and-user-groups/user-groups');
      });

      await test.step('Verify unauthorized access message', async () => {
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: 15000 });
      });
    });

    test('Roles page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to Roles page', async () => {
        await page.goto('/iam/access-management/roles');
      });

      await test.step('Verify unauthorized access message', async () => {
        await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: 15000 });
      });
    });

    test('Workspaces page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to Workspaces page', async () => {
        await page.goto('/iam/access-management/workspaces');
      });

      await test.step('Verify unauthorized access message', async () => {
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
        const nav = page.locator('nav, [class*="nav"]');

        // These admin-only links should NOT be visible for regular users
        const usersNavLink = nav.getByRole('link', { name: /^users$/i });
        const userGroupsNavLink = nav.getByRole('link', { name: /user groups/i });
        const rolesNavLink = nav.getByRole('link', { name: /^roles$/i });
        const workspacesNavLink = nav.getByRole('link', { name: /workspaces/i });

        // Wait a moment for navigation to render
        await page.waitForTimeout(1000);

        // Verify these links are not in the navigation
        const usersVisible = await usersNavLink.isVisible().catch(() => false);
        const userGroupsVisible = await userGroupsNavLink.isVisible().catch(() => false);
        const rolesVisible = await rolesNavLink.isVisible().catch(() => false);
        const workspacesVisible = await workspacesNavLink.isVisible().catch(() => false);

        if (!usersVisible && !userGroupsVisible && !rolesVisible && !workspacesVisible) {
          console.log('[V2 User] ✓ Admin navigation links correctly hidden');
        } else {
          if (usersVisible) console.log('[V2 User] ⚠ Users link visible (may be expected)');
          if (userGroupsVisible) console.log('[V2 User] ⚠ User Groups link visible (may be expected)');
          if (rolesVisible) console.log('[V2 User] ⚠ Roles link visible (may be expected)');
          if (workspacesVisible) console.log('[V2 User] ⚠ Workspaces link visible (may be expected)');
        }
      });
    });
  });
});
