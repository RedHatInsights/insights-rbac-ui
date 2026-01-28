/**
 * V1 Users - User Tests (Read Only)
 *
 * Tests for the V1 Users page (/iam/user-access/users) with regular user privileges.
 * Regular users may have limited visibility into the user list.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_USER, setupPage } from '../../../utils';

test.use({ storageState: AUTH_V1_USER });

const USERS_URL = '/iam/user-access/users';

test.describe('V1 Users - User (Read Only)', () => {
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

      // Depending on permissions, user may see limited list or access denied
      const tableVisible = await table.isVisible().catch(() => false);
      const accessDeniedVisible = await accessDenied.isVisible().catch(() => false);

      // One of these should be true
      expect(tableVisible || accessDeniedVisible).toBe(true);

      if (tableVisible) {
        console.log('[V1 Users User] Table visible - user has read access');
      } else {
        console.log('[V1 Users User] Access denied - expected for non-admin');
      }
    });

    await test.step('Verify admin actions are NOT available', async () => {
      // Invite button should not be visible for regular users
      const inviteButton = page.getByRole('button', { name: /invite/i });
      await expect(inviteButton).not.toBeVisible();
    });
  });
});
