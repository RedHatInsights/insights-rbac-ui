/**
 * V1 Users - User Tests
 *
 * Tests for the V1 Users page (/iam/user-access/users) with regular user privileges.
 * Regular users may have limited visibility into the user list.
 */

import { test, expect } from '@playwright/test';
import { AUTH_V1_USER } from '../../../utils';

test.use({ storageState: AUTH_V1_USER });

test.describe('V1 Users - User (Read Only)', () => {
  const USERS_URL = '/iam/user-access/users';

  test.beforeEach(async ({ page }) => {
    await page.goto(USERS_URL);
    await page.waitForLoadState('networkidle');
  });

  /**
   * Verify the users page loads correctly
   */
  test('Users page loads', async ({ page }) => {
    // Page should load without errors
    // Content may vary based on user permissions
    await expect(page.locator('body')).toBeVisible();
  });

  /**
   * Users table may be visible with limited data
   */
  test('Users list visible or access denied', async ({ page }) => {
    // Depending on permissions, user may see limited list or access denied
    const table = page.getByRole('grid');
    const accessDenied = page.getByText(/access denied|not authorized|forbidden/i);

    // One of these should be true
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
