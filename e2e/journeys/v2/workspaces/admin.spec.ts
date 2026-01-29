/**
 * V2 Workspaces - OrgAdmin Tests
 *
 * Tests for the V2 Workspaces page (/iam/access-management/workspaces)
 * with admin privileges.
 *
 * Test Pattern:
 * - Use `test.step()` to group related assertions within a single test
 * - Pay the "page load tax" once per test, not per assertion
 * - CRUD lifecycle uses serial mode to maintain state across create → edit → delete
 */

import { AUTH_V2_ADMIN, expect, getSeededWorkspaceData, getSeededWorkspaceName, setupPage, test, waitForTableUpdate } from '../../../utils';

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

test.describe('V2 Workspaces - OrgAdmin', () => {
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

// ═══════════════════════════════════════════════════════════════════════════
// JOURNEY 2: CRUD LIFECYCLE (Ephemeral Data)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('V2 Workspaces - OrgAdmin CRUD Lifecycle Journey', () => {
  // Generate unique name for this test run (parallel-safe)
  const timestamp = Date.now();
  const workspaceName = `${TEST_PREFIX}__Lifecycle_Workspace_${timestamp}`;
  const workspaceDescription = 'E2E lifecycle test workspace';
  const editedDescription = 'E2E lifecycle test workspace (edited)';

  const WORKSPACES_URL = '/iam/access-management/workspaces';

  test('Create → View → Edit → Delete → Verify Deleted', async ({ page }) => {
    await setupPage(page);

    console.log(`\n[V2 Workspaces CRUD] Starting lifecycle test`);
    console.log(`[V2 Workspaces CRUD] Workspace name: ${workspaceName}\n`);

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 1: CREATE
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 1: Create new workspace via modal', async () => {
      await page.goto(WORKSPACES_URL);
      await expect(page.getByRole('heading', { name: /workspaces/i })).toBeVisible();

      // Click Create Workspace button
      const createButton = page.getByRole('button', { name: /create workspace/i });
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled({ timeout: 10000 });
      await createButton.click();

      // Fill modal form
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 10000 });

      const nameInput = modal.getByLabel(/name/i).first();
      await expect(nameInput).toBeVisible({ timeout: 5000 });
      await nameInput.fill(workspaceName);

      const descriptionInput = modal.getByLabel(/description/i);
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill(workspaceDescription);
      }

      // Submit
      const submitButton = modal.getByRole('button', { name: /submit|create|save/i });
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      await expect(modal).not.toBeVisible({ timeout: 15000 });

      console.log(`[Create] ✓ Workspace created`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 2: VERIFY CREATION
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 2: Verify workspace appears in table', async () => {
      const searchInput = page.getByPlaceholder(/filter|search/i);
      await searchInput.fill(workspaceName);
      await waitForTableUpdate(page);

      await expect(page.getByRole('grid').getByText(workspaceName)).toBeVisible({ timeout: 10000 });

      console.log(`[Verify] ✓ Workspace found in table`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 3: VIEW DETAILS
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 3: Navigate to detail page and verify', async () => {
      const workspaceLink = page.getByRole('grid').getByRole('link', { name: workspaceName });
      await workspaceLink.click();

      // Verify detail page loads
      await expect(page.getByRole('heading', { name: workspaceName })).toBeVisible({ timeout: 10000 });

      // Navigate back to list
      await page.goto(WORKSPACES_URL);
      await expect(page.getByRole('heading', { name: /workspaces/i })).toBeVisible();

      console.log(`[View] ✓ Detail page verified`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 4: EDIT
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 4: Edit workspace from kebab menu', async () => {
      // Search for workspace
      const searchInput = page.getByPlaceholder(/filter|search/i);
      await searchInput.fill(workspaceName);
      await waitForTableUpdate(page);
      await expect(page.getByRole('grid').getByText(workspaceName)).toBeVisible({ timeout: 10000 });

      // Open kebab menu
      const workspaceRow = page.locator('tbody tr', { has: page.getByText(workspaceName) });
      const kebabButton = workspaceRow.getByRole('button', { name: /actions/i });
      await expect(kebabButton).toBeVisible();
      await kebabButton.click();

      // Click Edit
      const editOption = page.getByRole('menuitem', { name: /edit/i });
      await expect(editOption).toBeVisible();
      await editOption.click();

      // Fill edit modal
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      const descriptionInput = modal.locator('textarea, input[name*="description"]');
      if (await descriptionInput.isVisible()) {
        await descriptionInput.clear();
        await descriptionInput.fill(editedDescription);
      }

      // Save
      const saveButton = modal.getByRole('button', { name: /save|submit|update/i });
      await expect(saveButton).toBeEnabled();
      await saveButton.click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });

      console.log(`[Edit] ✓ Workspace edited`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 5: DELETE
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 5: Delete workspace from kebab menu', async () => {
      // Search for workspace
      const searchInput = page.getByPlaceholder(/filter|search/i);
      await searchInput.clear();
      await searchInput.fill(workspaceName);
      await waitForTableUpdate(page);
      await expect(page.getByRole('grid').getByText(workspaceName)).toBeVisible({ timeout: 10000 });

      // Open kebab menu
      const workspaceRow = page.locator('tbody tr', { has: page.getByText(workspaceName) });
      const kebabButton = workspaceRow.getByRole('button', { name: /actions/i });
      await expect(kebabButton).toBeVisible();
      await kebabButton.click();

      // Click Delete
      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      await expect(deleteOption).toBeVisible();
      await deleteOption.click();

      // Confirm deletion
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Check confirmation checkbox if present
      const checkbox = modal.getByRole('checkbox');
      if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox.click();
      }

      const confirmButton = modal.getByRole('button', { name: /delete|remove|confirm/i });
      await expect(confirmButton).toBeEnabled();
      await confirmButton.click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });

      console.log(`[Delete] ✓ Workspace deleted`);
    });

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 6: VERIFY DELETION
    // ─────────────────────────────────────────────────────────────────────
    await test.step('Phase 6: Verify workspace is deleted', async () => {
      const searchInput = page.getByPlaceholder(/filter|search/i);
      await searchInput.clear();
      await searchInput.fill(workspaceName);
      await waitForTableUpdate(page);

      await expect(page.getByRole('grid').getByText(workspaceName)).not.toBeVisible({ timeout: 10000 });

      console.log(`[Verify] ✓ Workspace no longer in table`);
      console.log(`\n[V2 Workspaces CRUD] Lifecycle test completed successfully!\n`);
    });
  });
});
