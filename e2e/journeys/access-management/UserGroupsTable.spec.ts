/**
 * User Groups Table E2E Tests
 * 
 * Converted from: src/user-journeys/access-management/UserGroupsTablePlusDetails.stories.tsx
 * 
 * Tests the User Groups table and details drawer.
 */

import { test, expect } from '@playwright/test';
import { AUTH_ADMIN } from '../../utils';

// Use admin storage state
test.use({ storageState: AUTH_ADMIN });

test.describe('User Groups Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iam/access-management/users-and-user-groups/user-groups');
    await page.waitForLoadState('networkidle');
  });

  /**
   * View groups table
   */
  test('User Groups table loads correctly', async ({ page }) => {
    // Verify User Groups tab is selected
    const userGroupsTab = page.getByRole('tab', { name: /user groups/i });
    await expect(userGroupsTab).toHaveAttribute('aria-selected', 'true');

    // Verify table is present
    await expect(page.getByRole('grid')).toBeVisible();
  });

  /**
   * Click group to open drawer
   */
  test('Click group opens details drawer', async ({ page }) => {
    // Wait for table to load with data
    const table = page.getByRole('grid');
    await expect(table).toBeVisible();

    // Click on first group row
    const firstGroupRow = page.locator('tbody tr').first();
    const groupName = firstGroupRow.locator('td').first();
    await groupName.click();

    // Drawer should open
    const drawer = page.locator('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    await expect(drawer).toBeVisible();
  });

  /**
   * Close drawer
   */
  test('Close drawer returns to table view', async ({ page }) => {
    // Open drawer by clicking a group
    const firstGroupRow = page.locator('tbody tr').first();
    await firstGroupRow.locator('td').first().click();

    // Drawer should be visible
    const drawer = page.locator('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    await expect(drawer).toBeVisible();

    // Close drawer (press Escape or click close button)
    await page.keyboard.press('Escape');

    // Drawer should be hidden
    await expect(drawer).not.toBeVisible();
  });

  /**
   * Navigate drawer tabs
   */
  test('Navigate between drawer tabs', async ({ page }) => {
    // Open drawer
    const firstGroupRow = page.locator('tbody tr').first();
    await firstGroupRow.locator('td').first().click();

    const drawer = page.locator('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    await expect(drawer).toBeVisible();

    // Find tabs in drawer
    const usersTab = drawer.getByRole('tab', { name: /users/i });
    const rolesTab = drawer.getByRole('tab', { name: /roles/i });

    // If tabs exist, navigate between them
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await expect(usersTab).toHaveAttribute('aria-selected', 'true');
    }

    if (await rolesTab.isVisible()) {
      await rolesTab.click();
      await expect(rolesTab).toHaveAttribute('aria-selected', 'true');
    }
  });
});
