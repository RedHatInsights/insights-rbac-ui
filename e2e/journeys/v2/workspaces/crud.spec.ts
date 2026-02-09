/**
 * V2 Workspaces - CRUD Tests
 *
 * Tests for creating, editing, and deleting workspaces.
 * Uses test.describe.serial() for lifecycle tests.
 *
 * Personas: Admin (only admin can perform CRUD)
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_USERVIEWER, waitForTableUpdate } from '../../../utils';
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
// Tests - Admin Only
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin', () => {
  test.use({ storageState: AUTH_V2_ADMIN });

  test(`Create Workspace button is visible [Admin]`, async ({ page }) => {
    const workspacesPage = new WorkspacesPage(page);
    await workspacesPage.goto();

    await expect(workspacesPage.createButton).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CRUD Lifecycle - Sequential Tests
  // ─────────────────────────────────────────────────────────────────────────

  test.describe.serial('CRUD Lifecycle [Admin]', () => {
    test('Create workspace', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.createButton.click();
      // Workspaces cannot be created at root level (as siblings of Default Workspace)
      // Must select a parent workspace first - use Default Workspace as parent
      await workspacesPage.fillCreateModal(workspaceName, workspaceDescription, 'Default Workspace');

      console.log(`[Create] ✓ Workspace created: ${workspaceName} (under Default Workspace)`);
    });

    test('Verify workspace appears in table', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(workspaceName);
      await workspacesPage.verifyWorkspaceInTable(workspaceName);

      console.log(`[Verify] ✓ Workspace found in table`);
    });

    test('View workspace detail page', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(workspaceName);
      await workspacesPage.navigateToDetail(workspaceName);

      await expect(page.getByRole('heading', { name: workspaceName })).toBeVisible();

      console.log(`[View] ✓ Detail page verified`);
    });

    test('Edit workspace description', async ({ page }) => {
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

    test('Verify edit was applied', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(workspaceName);
      await workspacesPage.navigateToDetail(workspaceName);

      await expect(page.getByText(editedDescription)).toBeVisible({ timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });

      console.log(`[Verify Edit] ✓ Changes confirmed`);
    });

    test('Delete workspace', async ({ page }) => {
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

    test('Verify workspace is deleted', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(workspaceName);
      await waitForTableUpdate(page);
      await workspacesPage.verifyWorkspaceNotInTable(workspaceName);

      console.log(`[Verify Delete] ✓ Workspace no longer exists`);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// UserViewer - Read-Only Restrictions
// ═══════════════════════════════════════════════════════════════════════════

test.describe('UserViewer', () => {
  test.use({ storageState: AUTH_V2_USERVIEWER });

  test(`Create Workspace button is disabled [UserViewer]`, async ({ page }) => {
    const workspacesPage = new WorkspacesPage(page);
    await workspacesPage.goto();

    // UserViewer can see workspaces but cannot create them - button is visible but disabled
    await expect(workspacesPage.createButton).toBeVisible();
    await expect(workspacesPage.createButton).toBeDisabled();
  });
});
