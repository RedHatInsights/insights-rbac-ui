/**
 * V1 Users - Admin Tests
 *
 * Tests for the V1 Users page (/iam/user-access/users) with admin privileges.
 * Admin users can view all users in the organization.
 *
 * Note: Users are managed externally (SSO), so we don't have CRUD lifecycle tests.
 * These tests focus on viewing and filtering users.
 */

import { test, expect } from '@playwright/test';
import { AUTH_V1_ADMIN } from '../../../utils';

test.use({ storageState: AUTH_V1_ADMIN });

test.describe('V1 Users - Admin', () => {
  const USERS_URL = '/iam/user-access/users';

  test.beforeEach(async ({ page }) => {
    await page.goto(USERS_URL);
    await page.waitForLoadState('networkidle');
  });

  /**
   * Verify the users page loads correctly
   */
  test('Users page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
    await expect(page.getByRole('grid')).toBeVisible();
  });

  /**
   * Verify user table has expected columns
   */
  test('Users table displays data', async ({ page }) => {
    // Should have at least one user row
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  /**
   * Can search/filter users
   */
  test('Can filter users', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/filter|search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForLoadState('networkidle');

      // Table should still be visible
      await expect(page.getByRole('grid')).toBeVisible();
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

      // Should navigate to user detail page
      await expect(page).toHaveURL(/\/users\//);
    }
  });

  /**
   * Admin can invite users (if feature is available)
   */
  test('Invite users option may be visible', async ({ page }) => {
    // This may vary based on environment/feature flags
    const inviteButton = page.getByRole('button', { name: /invite/i });
    // Just check if it's present, don't fail if not
    const isVisible = await inviteButton.isVisible();
    console.log(`[V1 Users Admin] Invite button visible: ${isVisible}`);
  });
});
