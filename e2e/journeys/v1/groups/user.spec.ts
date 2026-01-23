/**
 * V1 Groups - User Tests
 *
 * Tests for the V1 Groups page (/iam/user-access/groups) with regular user privileges.
 * Regular users can only view groups, not create/edit/delete.
 *
 * Test Pattern:
 * 1. Navigate to page
 * 2. Verify seeded group visible
 * 3. Verify NO Create button
 * 4. Open seeded group detail
 * 5. Verify NO Edit/Delete actions
 */

import { test, expect } from '@playwright/test';
import { AUTH_V1_USER, SEEDED_GROUP_NAME } from '../../../utils';

const TEST_PREFIX = process.env.TEST_PREFIX;

test.use({ storageState: AUTH_V1_USER });

test.describe('V1 Groups - User (Read Only)', () => {
  const GROUPS_URL = '/iam/user-access/groups';

  test.beforeEach(async ({ page }) => {
    await page.goto(GROUPS_URL);
    await page.waitForLoadState('networkidle');
  });

  /**
   * Verify the groups page loads correctly
   */
  test('Groups page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /groups/i })).toBeVisible();
    await expect(page.getByRole('grid')).toBeVisible();
  });

  /**
   * Search for seeded group and verify it's visible
   */
  test('Can view seeded group', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/filter|search/i);

    if (await searchInput.isVisible() && TEST_PREFIX) {
      const prefixedName = `${TEST_PREFIX}__${SEEDED_GROUP_NAME}`;
      await searchInput.fill(prefixedName);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(prefixedName)).toBeVisible();
    }
  });

  /**
   * Verify Create Group button is NOT visible for regular users
   */
  test('Create Group button is NOT visible', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create group/i });
    await expect(createButton).not.toBeVisible();
  });

  /**
   * Can view group detail page
   */
  test('Can view group detail', async ({ page }) => {
    const firstGroupLink = page.locator('tbody tr').first().getByRole('link').first();

    if (await firstGroupLink.isVisible()) {
      await firstGroupLink.click();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/\/groups\//);
    }
  });

  /**
   * Verify Edit/Delete actions are NOT available for regular users
   */
  test('Edit and Delete actions are NOT available', async ({ page }) => {
    const firstGroupLink = page.locator('tbody tr').first().getByRole('link').first();

    if (await firstGroupLink.isVisible()) {
      await firstGroupLink.click();
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
