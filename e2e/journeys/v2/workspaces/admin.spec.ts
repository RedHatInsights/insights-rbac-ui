/**
 * V2 Workspaces - Admin Tests
 *
 * Tests for the V2 Workspaces page (/iam/access-management/workspaces)
 * with admin privileges.
 *
 * Test Pattern:
 * - Use `test.step()` to group related assertions within a single test
 * - Pay the "page load tax" once per test, not per assertion
 * - CRUD lifecycle uses serial mode to maintain state across create → edit → delete
 */

import { AUTH_V2_ADMIN, Page, expect, getSeededWorkspaceData, getSeededWorkspaceName, setupPage, test } from '../../../utils';

// Safety rail: Require TEST_PREFIX for any test that creates data
const TEST_PREFIX = process.env.TEST_PREFIX;

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX environment variable is REQUIRED          ║\n' +
      '║                                                                      ║\n' +
      '║  This test creates data that must be prefixed to avoid polluting    ║\n' +
      '║  the shared environment. Set TEST_PREFIX before running:            ║\n' +
      '║                                                                      ║\n' +
      '║    TEST_PREFIX=yourprefix npx playwright test v2/workspaces         ║\n' +
      '║                                                                      ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

test.use({ storageState: AUTH_V2_ADMIN });

// Get seeded workspace name and data from seed map/fixture
const SEEDED_WORKSPACE_NAME = getSeededWorkspaceName();
const SEEDED_WORKSPACE_DATA = getSeededWorkspaceData();

test.describe('V2 Workspaces - Admin', () => {
  const WORKSPACES_URL = '/iam/access-management/workspaces';

  /**
   * Admin can find and inspect a seeded workspace
   * Single page load, multiple verification steps
   */
  test('Can find and inspect seeded workspace', async ({ page }) => {
    test.skip(!SEEDED_WORKSPACE_NAME, 'No seeded workspace found in seed map');
    await setupPage(page);
    await page.goto(WORKSPACES_URL);
    await expect(page.getByRole('heading', { name: /workspaces/i })).toBeVisible();

    await test.step('Verify Create Workspace button is visible', async () => {
      const createButton = page.getByRole('button', { name: /create workspace/i });
      await expect(createButton).toBeVisible();
    });

    await test.step('Search for the seeded workspace', async () => {
      const searchInput = page.getByPlaceholder(/filter|search/i);
      await searchInput.fill(SEEDED_WORKSPACE_NAME!);

      // Verify the seeded workspace appears in the table
      await expect(page.getByRole('grid').getByText(SEEDED_WORKSPACE_NAME!)).toBeVisible({ timeout: 10000 });
    });

    await test.step('Navigate to detail view', async () => {
      const workspaceLink = page.getByRole('grid').getByRole('link', { name: SEEDED_WORKSPACE_NAME! });
      await workspaceLink.click();

      await expect(page.getByRole('heading', { name: SEEDED_WORKSPACE_NAME! })).toBeVisible({ timeout: 15000 });
    });

    await test.step('Verify workspace details', async () => {
      // Verify the expected description is visible (if defined in seed fixture)
      if (SEEDED_WORKSPACE_DATA?.description) {
        await expect(page.getByText(SEEDED_WORKSPACE_DATA.description)).toBeVisible({ timeout: 30000 });
      }

      // Verify action buttons are available for admin
      const actionsButton = page.getByRole('button', { name: /actions/i });
      await expect(actionsButton).toBeVisible();
    });
  });
});

/**
 * CRUD Lifecycle Tests
 *
 * These tests run in serial mode to maintain state across:
 * Create → Verify → Edit → Delete → Verify Deleted
 *
 * Structure:
 * 1. "Create workspace" - Needs its own test
 * 2. "Manage workspace lifecycle" - All post-creation operations in one test with steps
 */
test.describe('V2 Workspaces - Admin CRUD Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  const workspaceName = `${TEST_PREFIX}__Lifecycle_Workspace_${timestamp}`;
  const workspaceDescription = 'E2E lifecycle test workspace';
  const editedDescription = 'E2E lifecycle test workspace (edited)';

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    if (!process.env.TEST_PREFIX) {
      throw new Error('TEST_PREFIX environment variable is required');
    }

    const context = await browser.newContext({ storageState: AUTH_V2_ADMIN });
    page = await context.newPage();
    await setupPage(page);

    console.log(`\n[V2 Workspaces Admin] Using prefix: ${TEST_PREFIX}`);
    console.log(`[V2 Workspaces Admin] Workspace name: ${workspaceName}\n`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  /**
   * Create a new workspace
   */
  test('Create workspace', async () => {
    await page.goto('/iam/access-management/workspaces');
    await expect(page.getByRole('heading', { name: /workspaces/i })).toBeVisible();

    await test.step('Open modal and fill workspace details', async () => {
      const createButton = page.getByRole('button', { name: /create workspace/i });
      await expect(createButton).toBeVisible();
      await createButton.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 10000 });

      const nameInput = modal.getByLabel(/name/i).first();
      await expect(nameInput).toBeVisible({ timeout: 5000 });
      await nameInput.fill(workspaceName);

      const descriptionInput = modal.getByLabel(/description/i);
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill(workspaceDescription);
      }
    });

    await test.step('Submit and verify', async () => {
      const modal = page.locator('[role="dialog"]');

      const submitButton = modal.getByRole('button', { name: /submit|create|save/i });
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      await expect(modal).not.toBeVisible({ timeout: 15000 });

      const searchInput = page.getByPlaceholder(/filter|search/i);
      await searchInput.fill(workspaceName);
      await expect(page.getByRole('grid').getByText(workspaceName)).toBeVisible({ timeout: 10000 });
      console.log(`[Create] Created workspace: ${workspaceName}`);
    });
  });

  /**
   * Manage workspace lifecycle: View → Edit → Delete
   * Single page load, multiple operations via steps
   */
  test('Manage workspace lifecycle', async () => {
    await page.goto('/iam/access-management/workspaces');
    await expect(page.getByRole('heading', { name: /workspaces/i })).toBeVisible();

    const searchInput = page.getByPlaceholder(/filter|search/i);
    await searchInput.fill(workspaceName);
    await expect(page.getByRole('grid').getByText(workspaceName)).toBeVisible({ timeout: 10000 });

    await test.step('View workspace details', async () => {
      const workspaceLink = page.getByRole('grid').getByRole('link', { name: workspaceName });
      await workspaceLink.click();

      await expect(page.getByRole('heading', { name: workspaceName })).toBeVisible({ timeout: 10000 });
      console.log(`[View] Verified workspace details: ${workspaceName}`);

      // Navigate back to list
      await page.goto('/iam/access-management/workspaces');
      await expect(page.getByRole('heading', { name: /workspaces/i })).toBeVisible();
      await searchInput.fill(workspaceName);
      await expect(page.getByRole('grid').getByText(workspaceName)).toBeVisible({ timeout: 10000 });
    });

    await test.step('Edit workspace description', async () => {
      const workspaceRow = page.locator('tbody tr', { has: page.getByText(workspaceName) });
      const kebabButton = workspaceRow.getByRole('button', { name: /actions/i });
      await expect(kebabButton).toBeVisible();
      await kebabButton.click();

      const editOption = page.getByRole('menuitem', { name: /edit/i });
      await expect(editOption).toBeVisible();
      await editOption.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      const descriptionInput = modal.locator('textarea, input[name*="description"]');
      if (await descriptionInput.isVisible()) {
        await descriptionInput.clear();
        await descriptionInput.fill(editedDescription);
      }

      const saveButton = modal.getByRole('button', { name: /save|submit|update/i });
      await expect(saveButton).toBeEnabled();
      await saveButton.click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
      console.log(`[Edit] Edited workspace: ${workspaceName}`);
    });

    await test.step('Delete workspace', async () => {
      await searchInput.clear();
      await searchInput.fill(workspaceName);
      await expect(page.getByRole('grid').getByText(workspaceName)).toBeVisible({ timeout: 10000 });

      const workspaceRow = page.locator('tbody tr', { has: page.getByText(workspaceName) });
      const kebabButton = workspaceRow.getByRole('button', { name: /actions/i });
      await expect(kebabButton).toBeVisible();
      await kebabButton.click();

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      await expect(deleteOption).toBeVisible();
      await deleteOption.click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible({ timeout: 5000 });

      const checkbox = modal.getByRole('checkbox');
      if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox.click();
      }

      const confirmButton = modal.getByRole('button', { name: /delete|remove|confirm/i });
      await expect(confirmButton).toBeEnabled();
      await confirmButton.click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
      console.log(`[Delete] Deleted workspace: ${workspaceName}`);
    });

    await test.step('Verify workspace is deleted', async () => {
      await searchInput.clear();
      await searchInput.fill(workspaceName);
      await page.waitForTimeout(1000);

      await expect(page.getByRole('grid').getByText(workspaceName)).not.toBeVisible({ timeout: 10000 });
      console.log(`[Verify] Verified deletion: ${workspaceName}`);
      console.log(`\n[V2 Workspaces Admin] Lifecycle test completed successfully!\n`);
    });
  });
});
