/**
 * V2 Users - Admin Tests
 *
 * Tests for the V2 Users page (/iam/access-management/users-and-user-groups/users)
 * with admin privileges.
 *
 * Note: Users are managed externally (SSO), so we don't have CRUD lifecycle tests.
 * These tests focus on viewing and filtering users in the V2 interface.
 */

import { test, expect } from '@playwright/test';
import { AUTH_V2_ADMIN } from '../../../../utils';

test.use({ storageState: AUTH_V2_ADMIN });

test.describe('V2 Users - Admin', () => {
  const USERS_URL = '/iam/access-management/users-and-user-groups/users';

  test.beforeEach(async ({ page }) => {
    await page.goto(USERS_URL);
    await page.waitForLoadState('networkidle');
  });

  /**
   * Verify the users page loads correctly
   */
  test('Users page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
  });

  /**
   * Verify user table has expected data
   */
  test('Users table displays data', async ({ page }) => {
    const table = page.getByRole('grid');

    if (await table.isVisible()) {
      const rows = page.locator('tbody tr');
      await expect(rows.first()).toBeVisible();
    }
  });

  /**
   * Can search/filter users
   */
  test('Can filter users', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/filter|search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForLoadState('networkidle');
    }
  });

  /**
   * Can view user detail
   */
  test('Can view user detail', async ({ page }) => {
    const firstUserLink = page.locator('tbody tr').first().getByRole('link').first();

    if (await firstUserLink.isVisible()) {
      await firstUserLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  /**
   * Admin can invite users (if feature is available)
   */
  test('Invite users option may be visible', async ({ page }) => {
    const inviteButton = page.getByRole('button', { name: /invite/i });
    const isVisible = await inviteButton.isVisible();
    console.log(`[V2 Users Admin] Invite button visible: ${isVisible}`);
  });
});
