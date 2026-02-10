/**
 * Workspace Management Tests
 *
 * Tests for creating, editing, and deleting workspaces (Admin only).
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It creates, edits, or deletes a workspace
 *   ✓ It checks if a button/action for create/edit/delete is visible/hidden/disabled
 *   ✓ It verifies a permission denial (403) for write operations
 *
 * DO NOT add here if:
 *   ✗ It only reads/views data → workspace-detail.spec.ts
 *   ✗ It tests table sorting/filtering/pagination → workspace-list.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ADMIN from utils
 *   - UTILS: Use WorkspacesPage for UI interactions
 *   - PREFIX: Requires TEST_PREFIX_V2 env var for safe test isolation
 *
 * NOTE: Workspaces cannot be created at root level - must select a parent workspace.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, waitForTableUpdate } from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = process.env.TEST_PREFIX_V2;

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX_V2 environment variable is REQUIRED       ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

// Generate unique name for this test run
const timestamp = Date.now();
const workspaceName = `${TEST_PREFIX}__Lifecycle_Workspace_${timestamp}`;
const workspaceDescription = 'E2E lifecycle test workspace';
const editedDescription = 'E2E lifecycle test workspace (edited)';

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Workspace Management', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full CRUD access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('Admin Lifecycle', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test('Create workspace [Admin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.createButton.click();
      // Workspaces cannot be created at root level (yet)
      // Must select a child workspace as parent - use Default Workspace
      await workspacesPage.fillCreateModal(workspaceName, workspaceDescription, 'Default Workspace');

      console.log(`[Create] ✓ Workspace created: ${workspaceName} (under Default Workspace)`);
    });

    // Server-side caching can delay the workspace appearing in list results.
    // Poll with page reloads to tolerate eventual consistency.
    test('Verify workspace appears in table [Admin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);

      await expect(async () => {
        await workspacesPage.goto();
        await workspacesPage.searchFor(workspaceName);
        await expect(workspacesPage.table.getByText(workspaceName)).toBeVisible();
      }).toPass({ timeout: E2E_TIMEOUTS.SLOW_DATA, intervals: [5_000] });

      console.log(`[Verify] ✓ Workspace found in table`);
    });

    test('View workspace detail page [Admin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(workspaceName);
      await workspacesPage.navigateToDetail(workspaceName);

      await expect(page.getByRole('heading', { name: workspaceName })).toBeVisible();

      console.log(`[View] ✓ Detail page verified`);
    });

    test('Edit workspace description [Admin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(workspaceName);
      await workspacesPage.navigateToDetail(workspaceName);

      // Open Actions menu and click Edit
      await page.getByRole('button', { name: /actions/i }).click();
      await page.getByRole('menuitem', { name: /edit/i }).click();

      await workspacesPage.fillEditForm(editedDescription);

      console.log(`[Edit] ✓ Workspace description updated`);
    });

    test('Verify edit was applied [Admin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(workspaceName);
      await workspacesPage.navigateToDetail(workspaceName);

      await expect(page.getByText(editedDescription)).toBeVisible({ timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });

      console.log(`[Verify Edit] ✓ Changes confirmed`);
    });

    test('Delete workspace [Admin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(workspaceName);
      await workspacesPage.navigateToDetail(workspaceName);

      // Open Actions menu and click Delete
      await page.getByRole('button', { name: /actions/i }).click();
      await page.getByRole('menuitem', { name: /delete/i }).click();

      await workspacesPage.confirmDelete();

      console.log(`[Delete] ✓ Deletion confirmed`);
    });

    test('Verify workspace is deleted [Admin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(workspaceName);
      await waitForTableUpdate(page);
      await workspacesPage.verifyWorkspaceNotInTable(workspaceName);

      console.log(`[Verify Delete] ✓ Workspace no longer exists`);
    });
  });

  test.describe('Admin', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test(`Create Workspace button is visible [Admin]`, async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await expect(workspacesPage.createButton).toBeVisible();
    });
  });
});
