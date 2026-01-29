/**
 * V1 Groups - User Viewer Tests
 *
 * Tests for the V1 Groups page (/iam/user-access/groups) with User Viewer privileges.
 * User Viewers (rbac:*:read) can view groups but not create/edit/delete.
 *
 * Test Pattern:
 * 1. Navigate to page
 * 2. Verify seeded group visible
 * 3. Verify NO Create button
 * 4. Open seeded group detail
 * 5. Verify NO Edit/Delete actions
 */

import { AUTH_V1_USERVIEWER, expect, getSeededGroupData, getSeededGroupName, setupPage, test } from '../../../utils';

test.use({ storageState: AUTH_V1_USERVIEWER });

// Get seeded group name and data from seed map/fixture
const SEEDED_GROUP_NAME = getSeededGroupName();
const SEEDED_GROUP_DATA = getSeededGroupData();

test.describe('V1 Groups - UserViewer', () => {
  const GROUPS_URL = '/iam/user-access/groups';

  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await page.goto(GROUPS_URL);
    // Wait for page content to load (heading indicates data is ready)
    await expect(page.getByRole('heading', { name: /groups/i })).toBeVisible();
  });

  /**
   * Search for seeded group and verify it's visible
   */
  test('Can view seeded group', async ({ page }) => {
    test.skip(!SEEDED_GROUP_NAME, 'No seeded group found in seed map');
    const searchInput = page.getByPlaceholder(/filter|search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill(SEEDED_GROUP_NAME!);

      // Verify the seeded group appears in the table (auto-waits for search results)
      await expect(page.getByRole('grid').getByText(SEEDED_GROUP_NAME!)).toBeVisible();
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
   * Can view group detail page with seeded data
   */
  test('Can view group detail', async ({ page }) => {
    test.skip(!SEEDED_GROUP_NAME, 'No seeded group found in seed map');
    const searchInput = page.getByPlaceholder(/filter|search/i);

    // Search for the seeded group
    await searchInput.fill(SEEDED_GROUP_NAME!);

    // Click on the seeded group in the table (auto-waits for element)
    const groupLink = page.getByRole('grid').getByRole('link', { name: SEEDED_GROUP_NAME! });
    await groupLink.click();

    // Wait for URL to change to detail page
    await expect(page).toHaveURL(/\/groups\//);

    // Wait for the group name heading to appear (indicates detail page loaded)
    await expect(page.getByRole('heading', { name: SEEDED_GROUP_NAME! })).toBeVisible({ timeout: 15000 });

    // Verify description is visible (if defined in seed fixture)
    if (SEEDED_GROUP_DATA?.description) {
      await expect(page.getByText(SEEDED_GROUP_DATA.description)).toBeVisible({ timeout: 30000 });
    }
  });

  /**
   * Verify Edit/Delete actions are NOT available for regular users
   */
  test('Edit and Delete actions are NOT available', async ({ page }) => {
    test.skip(!SEEDED_GROUP_NAME, 'No seeded group found in seed map');
    const searchInput = page.getByPlaceholder(/filter|search/i);

    // Search for and navigate to the seeded group
    await searchInput.fill(SEEDED_GROUP_NAME!);
    const groupLink = page.getByRole('grid').getByRole('link', { name: SEEDED_GROUP_NAME! });
    await groupLink.click();

    // Wait for detail page to load
    await expect(page.getByRole('heading', { name: SEEDED_GROUP_NAME! })).toBeVisible({ timeout: 15000 });

    // Verify edit/delete buttons are NOT visible
    const editButton = page.getByRole('button', { name: /edit/i });
    await expect(editButton).not.toBeVisible();

    const deleteButton = page.getByRole('button', { name: /delete/i });
    await expect(deleteButton).not.toBeVisible();
  });

  /**
   * Verify row kebab menu doesn't have edit/delete for regular users on seeded group
   */
  test('Row actions do NOT include Edit or Delete', async ({ page }) => {
    test.skip(!SEEDED_GROUP_NAME, 'No seeded group found in seed map');
    const searchInput = page.getByPlaceholder(/filter|search/i);

    // Search for the seeded group
    await searchInput.fill(SEEDED_GROUP_NAME!);

    // Find the row with the seeded group (auto-waits for search results)
    const seededRow = page.getByRole('row').filter({ hasText: SEEDED_GROUP_NAME! });
    const kebabButton = seededRow.getByRole('button', { name: /actions/i });

    if (await kebabButton.isVisible()) {
      await kebabButton.click();

      const editOption = page.getByRole('menuitem', { name: /edit/i });
      await expect(editOption).not.toBeVisible();

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      await expect(deleteOption).not.toBeVisible();
    }
  });
});
