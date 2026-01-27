/**
 * V2 Users - User Tests
 *
 * Tests for the V2 Users page (/iam/access-management/users-and-user-groups/users)
 * with regular user privileges.
 */

import { AUTH_V2_USER, expect, setupPage, test } from '../../../../utils';

test.use({ storageState: AUTH_V2_USER });

test.describe('V2 Users - User (Read Only)', () => {
  const USERS_URL = '/iam/access-management/users-and-user-groups/users';

  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await page.goto(USERS_URL);
    // Wait for page to load
    await expect(page.locator('body')).toBeVisible();
  });

  /**
   * Users table may be visible with limited data
   */
  test('Users list visible or access denied', async ({ page }) => {
    const table = page.getByRole('grid');
    const accessDenied = page.getByText(/access denied|not authorized|forbidden/i);

    const tableVisible = await table.isVisible();
    const accessDeniedVisible = await accessDenied.isVisible();

    expect(tableVisible || accessDeniedVisible).toBe(true);
  });

  /**
   * Verify NO invite users button for regular users
   */
  test('Invite users button is NOT visible', async ({ page }) => {
    const inviteButton = page.getByRole('button', { name: /invite/i });
    await expect(inviteButton).not.toBeVisible();
  });
});
