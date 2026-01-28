/**
 * V2 Users - User Tests (Read Only)
 *
 * Tests for the V2 Users page (/iam/access-management/users-and-user-groups/users)
 * with regular user privileges (non-admin).
 *
 * Regular users have read-only access or may not have access at all.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_USER, setupPage } from '../../../../utils';

test.use({ storageState: AUTH_V2_USER });

const USERS_URL = '/iam/access-management/users-and-user-groups/users';

test.describe('V2 Users - User (Read Only)', () => {
  test('Can view users list with limited permissions', async ({ page }) => {
    await setupPage(page);
    await page.goto(USERS_URL);

    await test.step('Verify page loads', async () => {
      // Wait for page content - either table or access denied message
      await expect(page.locator('body')).toBeVisible();
    });

    await test.step('Verify users list or access denied', async () => {
      const table = page.getByRole('grid');
      const accessDenied = page.getByText(/access denied|not authorized|forbidden/i);

      const tableVisible = await table.isVisible().catch(() => false);
      const accessDeniedVisible = await accessDenied.isVisible().catch(() => false);

      // One of these should be true
      expect(tableVisible || accessDeniedVisible).toBe(true);

      if (tableVisible) {
        console.log('[V2 Users User] Table visible - user has read access');
      } else {
        console.log('[V2 Users User] Access denied - expected for non-admin');
      }
    });

    await test.step('Verify admin actions are NOT available', async () => {
      // Invite button should not be visible for regular users
      const inviteButton = page.getByRole('button', { name: /invite/i });
      await expect(inviteButton).not.toBeVisible();

      // Add to user group button should not be visible
      const addToGroupButton = page.getByRole('button', { name: /add to user group/i });
      await expect(addToGroupButton).not.toBeVisible();
    });
  });
});
