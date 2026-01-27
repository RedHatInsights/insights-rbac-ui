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

import { test, expect, AUTH_V1_USER, setupPage, getSeededRoleName, getSeededRoleData } from '../../../utils';

test.use({ storageState: AUTH_V1_USER });

// Get seeded role name and data from seed map/fixture
const SEEDED_ROLE_NAME = getSeededRoleName();
const SEEDED_ROLE_DATA = getSeededRoleData();

test.describe('V1 Roles - User (Read Only)', () => {
  const ROLES_URL = '/iam/user-access/roles';

  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await page.goto(ROLES_URL);
    // Wait for page content to load (heading indicates data is ready)
    await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();
  });

  /**
   * Search for seeded role and verify it's visible
   */
  test('Can view seeded role', async ({ page }) => {
    test.skip(!SEEDED_ROLE_NAME, 'No seeded role found in seed map');
    const searchInput = page.getByPlaceholder(/filter|search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill(SEEDED_ROLE_NAME!);

      // Verify the seeded role appears in the table (auto-waits for search results)
      await expect(page.getByRole('grid').getByText(SEEDED_ROLE_NAME!)).toBeVisible();
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
   * Can view seeded role detail page with expected content
   */
  test('Can view role detail', async ({ page }) => {
    test.skip(!SEEDED_ROLE_NAME, 'No seeded role found in seed map');
    const searchInput = page.getByPlaceholder(/filter|search/i);

    // Search for the seeded role
    await searchInput.fill(SEEDED_ROLE_NAME!);

    // Click on the seeded role in the table (auto-waits for element)
    const roleLink = page.getByRole('grid').getByRole('link', { name: SEEDED_ROLE_NAME! });
    await roleLink.click();

    // Wait for URL to change to detail page
    await expect(page).toHaveURL(/\/roles\//);

    // Wait for the role name heading to appear (indicates detail page loaded)
    await expect(page.getByRole('heading', { name: SEEDED_ROLE_NAME! })).toBeVisible({ timeout: 15000 });

    // Verify description is visible (if defined in seed fixture)
    if (SEEDED_ROLE_DATA?.description) {
      await expect(page.getByText(SEEDED_ROLE_DATA.description)).toBeVisible({ timeout: 30000 });
    }
  });

  /**
   * Verify Edit/Delete actions are NOT available for regular users on seeded role
   */
  test('Edit and Delete actions are NOT available', async ({ page }) => {
    test.skip(!SEEDED_ROLE_NAME, 'No seeded role found in seed map');
    const searchInput = page.getByPlaceholder(/filter|search/i);

    // Search for and navigate to the seeded role
    await searchInput.fill(SEEDED_ROLE_NAME!);
    const roleLink = page.getByRole('grid').getByRole('link', { name: SEEDED_ROLE_NAME! });
    await roleLink.click();

    // Wait for detail page to load
    await expect(page.getByRole('heading', { name: SEEDED_ROLE_NAME! })).toBeVisible({ timeout: 15000 });

    // Verify no Edit button
    const editButton = page.getByRole('button', { name: /edit/i });
    await expect(editButton).not.toBeVisible();

    // Verify no Delete button
    const deleteButton = page.getByRole('button', { name: /delete/i });
    await expect(deleteButton).not.toBeVisible();
  });

  /**
   * Verify row kebab menu doesn't have edit/delete for regular users on seeded role
   */
  test('Row actions do NOT include Edit or Delete', async ({ page }) => {
    test.skip(!SEEDED_ROLE_NAME, 'No seeded role found in seed map');
    const searchInput = page.getByPlaceholder(/filter|search/i);

    // Search for the seeded role
    await searchInput.fill(SEEDED_ROLE_NAME!);

    // Find the row with the seeded role (auto-waits for search results)
    const seededRow = page.getByRole('row').filter({ hasText: SEEDED_ROLE_NAME! });
    const kebabButton = seededRow.getByRole('button', { name: /actions/i });

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
