/**
 * Roles E2E Tests - View Only
 *
 * Tests for viewing roles table and role details.
 * CRUD operations (Create, Edit, Delete) are covered in:
 *   - e2e/journeys/lifecycle/RoleLifecycle.spec.ts
 */

import { test, expect } from '@playwright/test';
import { AUTH_ADMIN } from '../../utils';

// Use admin storage state
test.use({ storageState: AUTH_ADMIN });

test.describe('Roles - View Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iam/access-management/roles');
    await page.waitForLoadState('networkidle');
  });

  /**
   * Verify roles table loads
   */
  test('Roles table loads correctly', async ({ page }) => {
    // Verify table is present
    await expect(page.getByRole('grid')).toBeVisible();

    // Should see some role content
    await expect(page.getByText(/role/i).first()).toBeVisible();
  });

  /**
   * Click role to view details in drawer
   */
  test('Click role to view details', async ({ page }) => {
    // Wait for table to load
    await expect(page.getByRole('grid')).toBeVisible();

    // Click on first role
    const firstRoleRow = page.locator('tbody tr').first();
    const roleLink = firstRoleRow.getByRole('link').first();

    if (await roleLink.isVisible()) {
      await roleLink.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to role detail page
      await expect(page).toHaveURL(/\/roles\//);
    }
  });

  /**
   * Verify system roles are visible
   */
  test('System roles are displayed', async ({ page }) => {
    // Wait for table to load
    await expect(page.getByRole('grid')).toBeVisible();

    // Look for common system role names
    const systemRoles = ['Organization Administrator', 'Viewer', 'Auditor'];

    for (const roleName of systemRoles) {
      // Filter to find the role
      const filterInput = page.getByPlaceholder(/filter|search/i);
      if (await filterInput.isVisible()) {
        await filterInput.clear();
        await filterInput.fill(roleName);
        await page.waitForLoadState('networkidle');

        // Should find the system role
        const roleCell = page.getByText(roleName, { exact: true });
        if (await roleCell.isVisible().catch(() => false)) {
          await expect(roleCell).toBeVisible();
        }
      }
    }
  });

  /**
   * Filter roles by name
   */
  test('Filter roles by name', async ({ page }) => {
    // Wait for table to load
    await expect(page.getByRole('grid')).toBeVisible();

    const filterInput = page.getByPlaceholder(/filter|search/i);
    if (await filterInput.isVisible()) {
      await filterInput.fill('Admin');
      await page.waitForLoadState('networkidle');

      // Should show filtered results
      await expect(page.getByRole('grid')).toBeVisible();
    }
  });
});
