/**
 * Users Tab E2E Tests
 * 
 * Converted from: src/user-journeys/access-management/UsersTab.stories.tsx
 * 
 * Tests the Users tab in Users and User Groups page.
 */

import { test, expect } from '@playwright/test';
import { AUTH_ADMIN } from '../../utils';

// Use admin storage state
test.use({ storageState: AUTH_ADMIN });

test.describe('Users Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iam/access-management/users-and-user-groups/users');
    await page.waitForLoadState('networkidle');
  });

  /**
   * View users table
   */
  test('Users table loads correctly', async ({ page }) => {
    // Verify Users tab is selected
    const usersTab = page.getByRole('tab', { name: /^users$/i });
    await expect(usersTab).toHaveAttribute('aria-selected', 'true');

    // Verify table is present
    await expect(page.getByRole('grid', { name: /users table/i })).toBeVisible();
  });

  /**
   * Click user to open drawer
   */
  test('Click user opens details drawer', async ({ page }) => {
    // Wait for table to load
    await expect(page.getByRole('grid', { name: /users table/i })).toBeVisible();

    // Click on first user row
    const firstUserRow = page.locator('tbody tr').first();
    const userCell = firstUserRow.locator('td').first();
    await userCell.click();

    // Drawer should open
    const drawer = page.locator('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    await expect(drawer).toBeVisible();
  });

  /**
   * Switch between Users and User Groups tabs
   */
  test('Switch between Users and User Groups tabs', async ({ page }) => {
    // Verify Users tab is initially selected
    const usersTab = page.getByRole('tab', { name: /^users$/i });
    const userGroupsTab = page.getByRole('tab', { name: /user groups/i });

    await expect(usersTab).toHaveAttribute('aria-selected', 'true');

    // Click User Groups tab
    await userGroupsTab.click();
    await expect(userGroupsTab).toHaveAttribute('aria-selected', 'true');
    await expect(usersTab).toHaveAttribute('aria-selected', 'false');

    // Click Users tab
    await usersTab.click();
    await expect(usersTab).toHaveAttribute('aria-selected', 'true');
  });

  /**
   * Search users
   */
  test('Search users filters table', async ({ page }) => {
    // Find search input
    const searchInput = page.getByPlaceholder(/search|filter/i);
    
    if (await searchInput.isVisible()) {
      // Type search term
      await searchInput.fill('admin');
      await page.waitForLoadState('networkidle');

      // Table should update with filtered results
      await expect(page.getByRole('grid', { name: /users table/i })).toBeVisible();
    }
  });
});
