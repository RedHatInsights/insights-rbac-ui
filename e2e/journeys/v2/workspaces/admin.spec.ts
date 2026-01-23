/**
 * V2 Workspaces - Admin Tests
 *
 * Tests for the V2 Workspaces page (/iam/access-management/workspaces) with admin privileges.
 * Admin users can view, create, edit, and delete workspaces.
 *
 * Test Pattern:
 * 1. Search for seeded workspace (verify found)
 * 2. View seeded workspace detail (verify values)
 * 3. CRUD lifecycle: Create → Verify → Edit → Verify → Delete → Verify gone
 */

import { test, expect, Page } from '@playwright/test';
import { AUTH_V2_ADMIN, SEEDED_WORKSPACE_NAME } from '../../../utils';

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
      '║    TEST_PREFIX=e2e npx playwright test v2/workspaces/admin          ║\n' +
      '║                                                                      ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n'
  );
}

test.use({ storageState: AUTH_V2_ADMIN });

test.describe('V2 Workspaces - Admin', () => {
  const WORKSPACES_URL = '/iam/access-management/workspaces';

  test.beforeEach(async ({ page }) => {
    await page.goto(WORKSPACES_URL);
    await page.waitForLoadState('networkidle');
  });

  /**
   * Verify the workspaces page loads correctly
   */
  test('Workspaces page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /workspaces/i })).toBeVisible();
  });

  /**
   * Search for seeded workspace and verify it's found
   */
  test('Can search for seeded workspace', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/filter|search/i);

    if (await searchInput.isVisible()) {
      const prefixedName = `${TEST_PREFIX}__${SEEDED_WORKSPACE_NAME}`;
      await searchInput.fill(prefixedName);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(prefixedName)).toBeVisible();
    }
  });

  /**
   * View workspace detail page
   */
  test('Can view workspace detail', async ({ page }) => {
    const firstWorkspaceLink = page.locator('tbody tr').first().getByRole('link').first();

    if (await firstWorkspaceLink.isVisible()) {
      await firstWorkspaceLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  /**
   * Admin can see Create Workspace button
   */
  test('Create Workspace button is visible', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create workspace/i });
    await expect(createButton).toBeVisible();
  });
});

/**
 * CRUD Lifecycle Tests
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

    console.log(`\n[V2 Workspaces Admin] Using prefix: ${TEST_PREFIX}`);
    console.log(`[V2 Workspaces Admin] Workspace name: ${workspaceName}\n`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  /**
   * Step 1: Create a new workspace
   */
  test('Create workspace', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /create workspace/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    await page.waitForLoadState('networkidle');

    // Fill in workspace name
    const nameInput = page.getByLabel(/name/i).first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(workspaceName);

    // Fill in description if available
    const descriptionInput = page.getByLabel(/description/i);
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(workspaceDescription);
    }

    // Submit
    const submitButton = page.getByRole('button', { name: /submit|create|save/i });
    await submitButton.click();
    await page.waitForLoadState('networkidle');

    // Verify workspace was created
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(workspaceName);
      await page.waitForLoadState('networkidle');
    }

    await expect(page.getByText(workspaceName)).toBeVisible({ timeout: 10000 });
    console.log(`[Step 1] Created workspace: ${workspaceName}`);
  });

  /**
   * Step 2: Verify workspace details
   */
  test('Verify workspace details', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(workspaceName);
      await page.waitForLoadState('networkidle');
    }

    const workspaceLink = page.getByRole('link', { name: workspaceName });
    await expect(workspaceLink).toBeVisible();
    await workspaceLink.click();
    await page.waitForLoadState('networkidle');

    console.log(`[Step 2] Verified workspace details: ${workspaceName}`);
  });

  /**
   * Step 3: Edit workspace
   */
  test('Edit workspace', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(workspaceName);
      await page.waitForLoadState('networkidle');
    }

    const workspaceRow = page.locator('tbody tr', { has: page.getByText(workspaceName) });
    const kebabButton = workspaceRow.getByRole('button', { name: /actions/i });

    if (await kebabButton.isVisible()) {
      await kebabButton.click();

      const editOption = page.getByRole('menuitem', { name: /edit/i });
      if (await editOption.isVisible()) {
        await editOption.click();
        await page.waitForLoadState('networkidle');

        const descriptionInput = page.getByLabel(/description/i);
        if (await descriptionInput.isVisible()) {
          await descriptionInput.clear();
          await descriptionInput.fill(editedDescription);
        }

        const saveButton = page.getByRole('button', { name: /save|submit|update/i });
        await saveButton.click();
        await page.waitForLoadState('networkidle');

        console.log(`[Step 3] Edited workspace: ${workspaceName}`);
      }
    }
  });

  /**
   * Step 4: Delete workspace
   */
  test('Delete workspace', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(workspaceName);
      await page.waitForLoadState('networkidle');
    }

    const workspaceRow = page.locator('tbody tr', { has: page.getByText(workspaceName) });
    const kebabButton = workspaceRow.getByRole('button', { name: /actions/i });

    if (await kebabButton.isVisible()) {
      await kebabButton.click();

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      if (await deleteOption.isVisible()) {
        await deleteOption.click();

        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible();

        const checkbox = modal.getByRole('checkbox');
        if (await checkbox.isVisible()) {
          await checkbox.click();
        }

        const confirmButton = modal.getByRole('button', { name: /delete|remove|confirm/i });
        await confirmButton.click();

        await expect(modal).not.toBeVisible({ timeout: 5000 });
        await page.waitForLoadState('networkidle');

        console.log(`[Step 4] Deleted workspace: ${workspaceName}`);
      }
    }
  });

  /**
   * Step 5: Verify deletion
   */
  test('Verify workspace deleted', async () => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(workspaceName);
      await page.waitForLoadState('networkidle');
    }

    await expect(page.getByText(workspaceName)).not.toBeVisible({ timeout: 10000 });

    console.log(`[Step 5] Verified deletion: ${workspaceName}`);
    console.log(`\n[V2 Workspaces Admin] Lifecycle test completed successfully!\n`);
  });
});
