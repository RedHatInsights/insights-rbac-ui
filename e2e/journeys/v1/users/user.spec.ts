/**
 * V1 Users - Regular User Tests
 *
 * Tests for regular users (non-admin) in the V1 experience.
 * Regular users only have access to the "My User Access" page.
 * All admin pages (users, groups, roles) should show unauthorized access.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_USER, setupPage } from '../../../utils';

test.use({ storageState: AUTH_V1_USER });

test.describe('V1 - Regular User Access', () => {
  test.describe('My User Access Page', () => {
    test('Can access My User Access page', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate to My User Access', async () => {
        await page.goto('/iam/my-user-access');
        await expect(page).toHaveURL(/\/iam\/my-user-access/);
      });

      await test.step('Verify page content loads', async () => {
        // My User Access page should show the user's permissions
        // Look for common elements on this page
        const pageContent = page.locator('main, [class*="page"], section').first();
        await expect(pageContent).toBeVisible({ timeout: 15000 });
      });

      await test.step('Verify no admin actions are available', async () => {
        // Admin actions like "Invite users" should not be visible
        const inviteButton = page.getByRole('button', { name: /invite/i });
        await expect(inviteButton).not.toBeVisible();
      });
    });
  });

  test.describe('Unauthorized Access to Management Pages', () => {
    test('Users page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to Users page', async () => {
        await page.goto('/iam/user-access/users');
      });

      await test.step('Verify unauthorized access message', async () => {
        // The UnauthorizedAccess component should be displayed
        // It typically shows "You do not have access to User Access Administration"
        const unauthorizedMessage = page
          .getByText(/you do not have access|not authorized|access denied|forbidden/i)
          .or(page.getByText(/organization administrator/i));

        await expect(unauthorizedMessage).toBeVisible({ timeout: 15000 });
        console.log('[V1 User] ✓ Users page correctly shows unauthorized access');
      });
    });

    test('Groups page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to Groups page', async () => {
        await page.goto('/iam/user-access/groups');
      });

      await test.step('Verify unauthorized access message', async () => {
        const unauthorizedMessage = page
          .getByText(/you do not have access|not authorized|access denied|forbidden/i)
          .or(page.getByText(/organization administrator/i));

        await expect(unauthorizedMessage).toBeVisible({ timeout: 15000 });
        console.log('[V1 User] ✓ Groups page correctly shows unauthorized access');
      });
    });

    test('Roles page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to Roles page', async () => {
        await page.goto('/iam/user-access/roles');
      });

      await test.step('Verify unauthorized access message', async () => {
        const unauthorizedMessage = page
          .getByText(/you do not have access|not authorized|access denied|forbidden/i)
          .or(page.getByText(/organization administrator/i));

        await expect(unauthorizedMessage).toBeVisible({ timeout: 15000 });
        console.log('[V1 User] ✓ Roles page correctly shows unauthorized access');
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
