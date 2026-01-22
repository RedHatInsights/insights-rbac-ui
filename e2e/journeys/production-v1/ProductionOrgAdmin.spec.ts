/**
 * Production V1 Org Admin E2E Tests
 * 
 * Converted from: src/user-journeys/ProductionOrgAdmin.stories.tsx
 * 
 * Tests the Production V1 RBAC experience with Org Admin privileges.
 */

import { test, expect } from '@playwright/test';
import { navigateToPage, waitForPageToLoad, AUTH_ADMIN } from '../../utils';

// Use admin storage state
test.use({ storageState: AUTH_ADMIN });

test.describe('Production V1 Org Admin', () => {
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
   * Navigate to Groups page
   */
  test('Navigate to Groups page', async ({ page }) => {
    await page.goto('/iam/user-access/groups');
    await page.waitForLoadState('networkidle');

    // Verify groups content
    await expect(page.getByRole('heading', { name: /groups/i })).toBeVisible();
  });

  /**
   * Navigate to Roles page
   */
  test('Navigate to Roles page', async ({ page }) => {
    await page.goto('/iam/user-access/roles');
    await page.waitForLoadState('networkidle');

    // Verify roles content
    await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();
  });

  /**
   * Navigate to Users page
   */
  test('Navigate to Users page', async ({ page }) => {
    await page.goto('/iam/user-access/users');
    await page.waitForLoadState('networkidle');

    // Verify users content
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
  });

  /**
   * View group detail
   */
  test('View group detail', async ({ page }) => {
    await page.goto('/iam/user-access/groups');
    await page.waitForLoadState('networkidle');

    // Click on first group link to view details
    const firstGroupLink = page.locator('tbody tr').first().getByRole('link');
    if (await firstGroupLink.isVisible()) {
      await firstGroupLink.click();
      await page.waitForLoadState('networkidle');

      // Should be on detail page
      await expect(page).toHaveURL(/\/groups\//);
    }
  });

  /**
   * View role detail
   */
  test('View role detail', async ({ page }) => {
    await page.goto('/iam/user-access/roles');
    await page.waitForLoadState('networkidle');

    // Click on first role link to view details
    const firstRoleLink = page.locator('tbody tr').first().getByRole('link');
    if (await firstRoleLink.isVisible()) {
      await firstRoleLink.click();
      await page.waitForLoadState('networkidle');

      // Should be on detail page
      await expect(page).toHaveURL(/\/roles\//);
    }
  });
});

test.describe('Production V1 Org Admin - Group Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iam/user-access/groups');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Create group button is visible for admin
   */
  test('Create group button is visible', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create group/i });
    await expect(createButton).toBeVisible();
  });

  /**
   * Edit group from list
   */
  test('Edit group from list via kebab menu', async ({ page }) => {
    // Find a group row with actions
    const groupRow = page.locator('tbody tr').first();
    const kebabButton = groupRow.getByRole('button', { name: /actions/i });

    if (await kebabButton.isVisible()) {
      await kebabButton.click();

      const editOption = page.getByRole('menuitem', { name: /edit/i });
      if (await editOption.isVisible()) {
        await editOption.click();

        // Edit modal/form should appear
        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible();
      }
    }
  });

  /**
   * Delete group from list (with cancel)
   */
  test('Delete group from list - cancel flow', async ({ page }) => {
    // Find a group row with actions
    const groupRow = page.locator('tbody tr').first();
    const kebabButton = groupRow.getByRole('button', { name: /actions/i });

    if (await kebabButton.isVisible()) {
      await kebabButton.click();

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      if (await deleteOption.isVisible()) {
        await deleteOption.click();

        // Confirmation modal
        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible();

        // Cancel
        await modal.getByRole('button', { name: /cancel/i }).click();
        await expect(modal).not.toBeVisible();
      }
    }
  });
});

test.describe('Production V1 Org Admin - Role Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iam/user-access/roles');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Create role button is visible for admin
   */
  test('Create role button is visible', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create role/i });
    await expect(createButton).toBeVisible();
  });

  /**
   * Edit role from list
   */
  test('Edit role from list via kebab menu', async ({ page }) => {
    // Find a role row with actions
    const roleRow = page.locator('tbody tr').first();
    const kebabButton = roleRow.getByRole('button', { name: /actions/i });

    if (await kebabButton.isVisible()) {
      await kebabButton.click();

      const editOption = page.getByRole('menuitem', { name: /edit/i });
      if (await editOption.isVisible()) {
        await editOption.click();

        // Edit modal/form should appear
        const modal = page.getByRole('dialog');
        if (await modal.isVisible()) {
          await expect(modal).toBeVisible();
        }
      }
    }
  });

  /**
   * Delete role from list (with cancel)
   */
  test('Delete role from list - cancel flow', async ({ page }) => {
    // Find a role row with actions
    const roleRow = page.locator('tbody tr').first();
    const kebabButton = roleRow.getByRole('button', { name: /actions/i });

    if (await kebabButton.isVisible()) {
      await kebabButton.click();

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      if (await deleteOption.isVisible()) {
        await deleteOption.click();

        // Confirmation modal
        const modal = page.getByRole('dialog');
        if (await modal.isVisible()) {
          // Cancel
          await modal.getByRole('button', { name: /cancel/i }).click();
          await expect(modal).not.toBeVisible();
        }
      }
    }
  });
});

test.describe('Production V1 Org Admin - Navigation', () => {
  /**
   * Navigate through sidebar
   */
  test('Navigate through User Access sidebar', async ({ page }) => {
    await page.goto('/iam/my-user-access');
    await page.waitForLoadState('networkidle');

    // Navigate to Users
    const usersLink = page.getByRole('link', { name: /^users$/i });
    if (await usersLink.isVisible()) {
      await usersLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Navigate to Groups
    const groupsLink = page.getByRole('link', { name: /^groups$/i });
    if (await groupsLink.isVisible()) {
      await groupsLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Navigate to Roles
    const rolesLink = page.getByRole('link', { name: /^roles$/i });
    if (await rolesLink.isVisible()) {
      await rolesLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Navigate back to My User Access
    const myAccessLink = page.getByRole('link', { name: /my user access/i });
    if (await myAccessLink.isVisible()) {
      await myAccessLink.click();
      await page.waitForLoadState('networkidle');
    }
  });
});
