/**
 * V1 Roles - User Tests
 *
 * Tests for the V1 Roles page (/iam/user-access/roles) with regular user privileges.
 * Regular users can only view roles, not create/edit/delete.
 *
 * Test Pattern:
 * 1. Navigate to page
 * 2. Verify seeded role visible
 * 3. Verify NO Create button
 * 4. Open seeded role detail
 * 5. Verify NO Edit/Delete actions
 */

import { test, expect } from '@playwright/test';
import { AUTH_V1_USER, SEEDED_ROLE_NAME } from '../../../utils';

const TEST_PREFIX = process.env.TEST_PREFIX;

test.use({ storageState: AUTH_V1_USER });

test.describe('V1 Roles - User (Read Only)', () => {
  const ROLES_URL = '/iam/user-access/roles';

  test.beforeEach(async ({ page }) => {
    await page.goto(ROLES_URL);
    await page.waitForLoadState('networkidle');
  });

  /**
   * Verify the roles page loads correctly
   */
  test('Roles page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();
    await expect(page.getByRole('grid')).toBeVisible();
  });

  /**
   * Search for seeded role and verify it's visible
   */
  test('Can view seeded role', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/filter|search/i);

    if (await searchInput.isVisible() && TEST_PREFIX) {
      const prefixedName = `${TEST_PREFIX}__${SEEDED_ROLE_NAME}`;
      await searchInput.fill(prefixedName);
      await page.waitForLoadState('networkidle');

      // Verify the seeded role appears in results
      await expect(page.getByText(prefixedName)).toBeVisible();
    }
  });

  /**
   * Verify Create Role button is NOT visible for regular users
   */
  test('Create Role button is NOT visible', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create role/i });
    await expect(createButton).not.toBeVisible();
  });

  /**
   * Can view role detail page
   */
  test('Can view role detail', async ({ page }) => {
    // Click on first role link
    const firstRoleLink = page.locator('tbody tr').first().getByRole('link').first();

    if (await firstRoleLink.isVisible()) {
      await firstRoleLink.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to role detail page
      await expect(page).toHaveURL(/\/roles\//);
    }
  });

  /**
   * Verify Edit/Delete actions are NOT available for regular users
   */
  test('Edit and Delete actions are NOT available', async ({ page }) => {
    // Click on first role link to go to detail
    const firstRoleLink = page.locator('tbody tr').first().getByRole('link').first();

    if (await firstRoleLink.isVisible()) {
      await firstRoleLink.click();
      await page.waitForLoadState('networkidle');

      // Verify no Edit button
      const editButton = page.getByRole('button', { name: /edit/i });
      await expect(editButton).not.toBeVisible();

      // Verify no Delete button
      const deleteButton = page.getByRole('button', { name: /delete/i });
      await expect(deleteButton).not.toBeVisible();
    }
  });

  /**
   * Verify row kebab menu doesn't have edit/delete for regular users
   */
  test('Row actions do NOT include Edit or Delete', async ({ page }) => {
    // Check if kebab menu exists on first row
    const firstRow = page.locator('tbody tr').first();
    const kebabButton = firstRow.getByRole('button', { name: /actions/i });

    if (await kebabButton.isVisible()) {
      await kebabButton.click();

      // Verify no Edit option
      const editOption = page.getByRole('menuitem', { name: /edit/i });
      await expect(editOption).not.toBeVisible();

      // Verify no Delete option
      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      await expect(deleteOption).not.toBeVisible();
    }
  });
});
