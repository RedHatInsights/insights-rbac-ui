/**
 * Production V1 Org User E2E Tests
 * 
 * Converted from: src/user-journeys/ProductionOrgUser.stories.tsx
 * 
 * Tests the Production V1 RBAC experience with regular user (non-admin) privileges.
 * Verifies read-only access and absence of admin actions.
 */

import { test, expect } from '@playwright/test';
import { AUTH_USER } from '../../utils';

// Use regular user storage state (non-admin)
test.use({ storageState: AUTH_USER });

test.describe('Production V1 Org User (Read Only)', () => {
  /**
   * My User Access page loads correctly
   */
  test('My User Access page loads correctly', async ({ page }) => {
    await page.goto('/iam/my-user-access');
    await page.waitForLoadState('networkidle');

    // Verify page loads
    await expect(page.getByText(/my user access/i)).toBeVisible();
  });

  /**
   * View Groups page (read-only)
   */
  test('View Groups page (read-only)', async ({ page }) => {
    await page.goto('/iam/user-access/groups');
    await page.waitForLoadState('networkidle');

    // Verify groups content loads
    await expect(page.getByRole('heading', { name: /groups/i })).toBeVisible();

    // Regular users should NOT see "Create group" button
    const createButton = page.getByRole('button', { name: /create group/i });
    await expect(createButton).not.toBeVisible();
  });

  /**
   * View Roles page (read-only)
   */
  test('View Roles page (read-only)', async ({ page }) => {
    await page.goto('/iam/user-access/roles');
    await page.waitForLoadState('networkidle');

    // Verify roles content loads
    await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();

    // Regular users should NOT see "Create role" button
    const createButton = page.getByRole('button', { name: /create role/i });
    await expect(createButton).not.toBeVisible();
  });

  /**
   * View Users page (read-only)
   */
  test('View Users page (read-only)', async ({ page }) => {
    await page.goto('/iam/user-access/users');
    await page.waitForLoadState('networkidle');

    // Verify users content loads
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
  });

  /**
   * View group detail (read-only)
   */
  test('View group detail (read-only)', async ({ page }) => {
    await page.goto('/iam/user-access/groups');
    await page.waitForLoadState('networkidle');

    // Click on first group link
    const firstGroupLink = page.locator('tbody tr').first().getByRole('link');
    if (await firstGroupLink.isVisible()) {
      await firstGroupLink.click();
      await page.waitForLoadState('networkidle');

      // Should be on detail page
      await expect(page).toHaveURL(/\/groups\//);

      // Should NOT see edit or delete actions
      const editButton = page.getByRole('button', { name: /edit/i });
      const deleteButton = page.getByRole('button', { name: /delete/i });
      
      // These buttons should either not exist or be disabled for regular users
      if (await editButton.isVisible()) {
        await expect(editButton).toBeDisabled();
      }
      if (await deleteButton.isVisible()) {
        await expect(deleteButton).toBeDisabled();
      }
    }
  });

  /**
   * View role detail (read-only)
   */
  test('View role detail (read-only)', async ({ page }) => {
    await page.goto('/iam/user-access/roles');
    await page.waitForLoadState('networkidle');

    // Click on first role link
    const firstRoleLink = page.locator('tbody tr').first().getByRole('link');
    if (await firstRoleLink.isVisible()) {
      await firstRoleLink.click();
      await page.waitForLoadState('networkidle');

      // Should be on detail page
      await expect(page).toHaveURL(/\/roles\//);
    }
  });

  /**
   * No kebab menus for regular users
   */
  test('No action menus visible for regular users', async ({ page }) => {
    await page.goto('/iam/user-access/groups');
    await page.waitForLoadState('networkidle');

    // Wait for table to load
    await expect(page.getByRole('grid')).toBeVisible();

    // Regular users should not see kebab action menus on rows
    const kebabButtons = page.locator('tbody tr').first().getByRole('button', { name: /actions/i });
    
    // Either no kebab buttons, or they should be hidden
    const count = await kebabButtons.count();
    if (count > 0) {
      // If they exist, verify they're hidden or disabled
      await expect(kebabButtons.first()).not.toBeVisible();
    }
  });
});

test.describe('Production V1 Org User - Navigation', () => {
  /**
   * Navigate through sidebar (read-only sections)
   */
  test('Navigate through User Access sidebar', async ({ page }) => {
    await page.goto('/iam/my-user-access');
    await page.waitForLoadState('networkidle');

    // Navigate to Groups (should work, read-only)
    const groupsLink = page.getByRole('link', { name: /^groups$/i });
    if (await groupsLink.isVisible()) {
      await groupsLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /groups/i })).toBeVisible();
    }

    // Navigate to Roles (should work, read-only)
    const rolesLink = page.getByRole('link', { name: /^roles$/i });
    if (await rolesLink.isVisible()) {
      await rolesLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();
    }

    // Navigate back to My User Access
    const myAccessLink = page.getByRole('link', { name: /my user access/i });
    if (await myAccessLink.isVisible()) {
      await myAccessLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/my user access/i)).toBeVisible();
    }
  });
});
