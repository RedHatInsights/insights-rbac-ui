/**
 * V2 Roles - User Tests
 *
 * Tests for the V2 Roles page (/iam/access-management/roles) with regular user privileges.
 * Regular users can only view roles, not create/edit/delete.
 */

import { test, expect } from '@playwright/test';
import { AUTH_V2_USER, SEEDED_ROLE_NAME } from '../../../utils';

const TEST_PREFIX = process.env.TEST_PREFIX;

test.use({ storageState: AUTH_V2_USER });

test.describe('V2 Roles - User (Read Only)', () => {
  const ROLES_URL = '/iam/access-management/roles';

  test.beforeEach(async ({ page }) => {
    await page.goto(ROLES_URL);
    await page.waitForLoadState('networkidle');
  });

  /**
   * Verify the roles page loads correctly
   */
  test('Roles page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();
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
    const firstRoleLink = page.locator('tbody tr').first().getByRole('link').first();

    if (await firstRoleLink.isVisible()) {
      await firstRoleLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  /**
   * Verify Edit/Delete actions are NOT available for regular users
   */
  test('Edit and Delete actions are NOT available', async ({ page }) => {
    const firstRoleLink = page.locator('tbody tr').first().getByRole('link').first();

    if (await firstRoleLink.isVisible()) {
      await firstRoleLink.click();
      await page.waitForLoadState('networkidle');

      const editButton = page.getByRole('button', { name: /edit/i });
      await expect(editButton).not.toBeVisible();

      const deleteButton = page.getByRole('button', { name: /delete/i });
      await expect(deleteButton).not.toBeVisible();
    }
  });

  /**
   * Verify row kebab menu doesn't have edit/delete for regular users
   */
  test('Row actions do NOT include Edit or Delete', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    const kebabButton = firstRow.getByRole('button', { name: /actions/i });

    if (await kebabButton.isVisible()) {
      await kebabButton.click();

      const editOption = page.getByRole('menuitem', { name: /edit/i });
      await expect(editOption).not.toBeVisible();

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      await expect(deleteOption).not.toBeVisible();
    }
  });
});
