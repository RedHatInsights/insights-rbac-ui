/**
 * V2 Workspaces - User Tests
 *
 * Tests for the V2 Workspaces page (/iam/access-management/workspaces) with regular user privileges.
 * Regular users can only view workspaces, not create/edit/delete.
 */

import { AUTH_V2_USER, expect, getSeededWorkspaceData, getSeededWorkspaceName, setupPage, test } from '../../../utils';

test.use({ storageState: AUTH_V2_USER });

// Get seeded workspace name and data from seed map/fixture
const SEEDED_WORKSPACE_NAME = getSeededWorkspaceName();
const SEEDED_WORKSPACE_DATA = getSeededWorkspaceData();

test.describe('V2 Workspaces - User (Read Only)', () => {
  const WORKSPACES_URL = '/iam/access-management/workspaces';

  test.beforeEach(async ({ page }) => {
    await setupPage(page);
    await page.goto(WORKSPACES_URL);
    // Wait for page content to load (heading indicates data is ready)
    await expect(page.getByRole('heading', { name: /workspaces/i })).toBeVisible();
  });

  /**
   * Search for seeded workspace and verify it's visible
   */
  test('Can view seeded workspace', async ({ page }) => {
    test.skip(!SEEDED_WORKSPACE_NAME, 'No seeded workspace found in seed map');
    const searchInput = page.getByPlaceholder(/filter|search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill(SEEDED_WORKSPACE_NAME!);

      // Verify the seeded workspace appears in the table (auto-waits for search results)
      await expect(page.getByRole('grid').getByText(SEEDED_WORKSPACE_NAME!)).toBeVisible();
    }
  });

  /**
   * Verify Create Workspace button is NOT visible for regular users
   */
  test('Create Workspace button is NOT visible', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create workspace/i });
    await expect(createButton).not.toBeVisible();
  });

  /**
   * Can view seeded workspace detail page with expected content
   */
  test('Can view workspace detail', async ({ page }) => {
    test.skip(!SEEDED_WORKSPACE_NAME, 'No seeded workspace found in seed map');
    const searchInput = page.getByPlaceholder(/filter|search/i);

    // Search for the seeded workspace
    await searchInput.fill(SEEDED_WORKSPACE_NAME!);

    // Click on the seeded workspace in the table (auto-waits for element)
    const workspaceLink = page.getByRole('grid').getByRole('link', { name: SEEDED_WORKSPACE_NAME! });
    await workspaceLink.click();

    // Wait for URL to change to detail page
    await expect(page).toHaveURL(/\/workspaces\//);

    // Wait for the workspace name heading to appear (indicates detail page loaded)
    await expect(page.getByRole('heading', { name: SEEDED_WORKSPACE_NAME! })).toBeVisible({ timeout: 15000 });

    // Verify description is visible (if defined in seed fixture)
    if (SEEDED_WORKSPACE_DATA?.description) {
      await expect(page.getByText(SEEDED_WORKSPACE_DATA.description)).toBeVisible({ timeout: 30000 });
    }
  });

  /**
   * Verify Edit/Delete actions are NOT available for regular users on seeded workspace
   */
  test('Edit and Delete actions are NOT available', async ({ page }) => {
    test.skip(!SEEDED_WORKSPACE_NAME, 'No seeded workspace found in seed map');
    const searchInput = page.getByPlaceholder(/filter|search/i);

    // Search for and navigate to the seeded workspace
    await searchInput.fill(SEEDED_WORKSPACE_NAME!);
    const workspaceLink = page.getByRole('grid').getByRole('link', { name: SEEDED_WORKSPACE_NAME! });
    await workspaceLink.click();

    // Wait for detail page to load
    await expect(page.getByRole('heading', { name: SEEDED_WORKSPACE_NAME! })).toBeVisible({ timeout: 15000 });

    const editButton = page.getByRole('button', { name: /edit/i });
    await expect(editButton).not.toBeVisible();

    const deleteButton = page.getByRole('button', { name: /delete/i });
    await expect(deleteButton).not.toBeVisible();
  });

  /**
   * Verify row kebab menu doesn't have edit/delete for regular users on seeded workspace
   */
  test('Row actions do NOT include Edit or Delete', async ({ page }) => {
    test.skip(!SEEDED_WORKSPACE_NAME, 'No seeded workspace found in seed map');
    const searchInput = page.getByPlaceholder(/filter|search/i);

    // Search for the seeded workspace
    await searchInput.fill(SEEDED_WORKSPACE_NAME!);

    // Find the row with the seeded workspace (auto-waits for search results)
    const seededRow = page.getByRole('row').filter({ hasText: SEEDED_WORKSPACE_NAME! });
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
