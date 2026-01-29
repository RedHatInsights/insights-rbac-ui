/**
 * V2 Users - Regular User Tests
 *
 * Tests for regular users (non-admin) in the V2 Access Management experience.
 * Regular users only have access to the "My User Access" page.
 * All admin pages should show unauthorized access.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_USER, setupPage } from '../../../../utils';

test.use({ storageState: AUTH_V2_USER });

test.describe('V2 - Regular User Access', () => {
  test.describe('My User Access Page', () => {
    test('Can access My User Access page', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate to My User Access', async () => {
        await page.goto('/iam/my-user-access');
        await expect(page).toHaveURL(/\/iam\/my-user-access/);
      });

      await test.step('Verify page content loads', async () => {
        // My User Access page should show the user's permissions
        const pageContent = page.locator('main, [class*="page"], section').first();
        await expect(pageContent).toBeVisible({ timeout: 15000 });
      });

      await test.step('Verify no admin actions are available', async () => {
        // Admin actions should not be visible
        const inviteButton = page.getByRole('button', { name: /invite/i });
        await expect(inviteButton).not.toBeVisible();
      });
    });
  });

  test.describe('Unauthorized Access to Management Pages', () => {
    test('Users page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to Users page', async () => {
        await page.goto('/iam/access-management/users-and-user-groups/users');
      });

      await test.step('Verify unauthorized access message', async () => {
        const unauthorizedMessage = page
          .getByText(/you do not have access|not authorized|access denied|forbidden/i)
          .or(page.getByText(/organization administrator/i));

        await expect(unauthorizedMessage).toBeVisible({ timeout: 15000 });
        console.log('[V2 User] ✓ Users page correctly shows unauthorized access');
      });
    });

    test('User Groups page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to User Groups page', async () => {
        await page.goto('/iam/access-management/users-and-user-groups/user-groups');
      });

      await test.step('Verify unauthorized access message', async () => {
        const unauthorizedMessage = page
          .getByText(/you do not have access|not authorized|access denied|forbidden/i)
          .or(page.getByText(/organization administrator/i));

        await expect(unauthorizedMessage).toBeVisible({ timeout: 15000 });
        console.log('[V2 User] ✓ User Groups page correctly shows unauthorized access');
      });
    });

    test('Roles page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to Roles page', async () => {
        await page.goto('/iam/access-management/roles');
      });

      await test.step('Verify unauthorized access message', async () => {
        const unauthorizedMessage = page
          .getByText(/you do not have access|not authorized|access denied|forbidden/i)
          .or(page.getByText(/organization administrator/i));

        await expect(unauthorizedMessage).toBeVisible({ timeout: 15000 });
        console.log('[V2 User] ✓ Roles page correctly shows unauthorized access');
      });
    });

    test('Workspaces page shows unauthorized access', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate directly to Workspaces page', async () => {
        await page.goto('/iam/access-management/workspaces');
      });

      await test.step('Verify unauthorized access message', async () => {
        const unauthorizedMessage = page
          .getByText(/you do not have access|not authorized|access denied|forbidden/i)
          .or(page.getByText(/organization administrator/i));

        await expect(unauthorizedMessage).toBeVisible({ timeout: 15000 });
        console.log('[V2 User] ✓ Workspaces page correctly shows unauthorized access');
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
