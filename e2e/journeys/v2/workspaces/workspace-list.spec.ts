/**
 * Workspace List Tests
 *
 * Tests for the workspaces table/list view and unauthorized access checks.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It tests table visibility or structure
 *   ✓ It tests search/filter functionality
 *   ✓ It tests sorting or pagination
 *   ✓ It tests column visibility or ordering
 *   ✓ It verifies unauthorized access for non-admin personas
 *
 * DO NOT add here if:
 *   ✗ It creates, edits, or deletes a workspace → workspace-management.spec.ts
 *   ✗ It views workspace detail page content → workspace-detail.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View Workspaces
 * @personas
 *   - Admin: Full access to the workspaces page
 *   - UserViewer: Page blocked entirely (unauthorized message)
 *   - ReadOnlyUser: Page blocked entirely (unauthorized message)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ADMIN, AUTH_V2_USERVIEWER, AUTH_V2_READONLY from utils
 *   - DATA: Relies on SEEDED_WORKSPACE_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use WorkspacesPage for table interactions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER, getSeededWorkspaceName, setupPage } from '../../../utils';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const WORKSPACES_URL = '/iam/access-management/workspaces';

const SEEDED_WORKSPACE_NAME = getSeededWorkspaceName('v2');

if (!SEEDED_WORKSPACE_NAME) {
  throw new Error('No seeded workspace found in seed map. Run: npm run e2e:seed:v2');
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Workspace List', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test(`Can view workspaces list [Admin]`, async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await expect(workspacesPage.table).toBeVisible();
    });

    test(`Can search for seeded workspace [Admin]`, async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.verifyWorkspaceInTable(SEEDED_WORKSPACE_NAME);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test(`Workspaces page shows unauthorized access [UserViewer]`, async ({ page }) => {
      await setupPage(page);
      await page.goto(WORKSPACES_URL);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // READONLYUSER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V2_READONLY });

    test(`Workspaces page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
      await setupPage(page);
      await page.goto(WORKSPACES_URL);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ROOT WORKSPACE ACCESS GUARDS
  // ═══════════════════════════════════════════════════════════════════════════
  // Root Workspace is a system workspace that no user owns.
  // The Kessel access SDK reports no permissions for root-1.
  // These tests validate that the UI respects those constraints.
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Root Workspace access guards [Admin]', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test('Root Workspace name is not a clickable link [Admin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      // Root Workspace should NOT be a link — the access SDK denies `view` on root
      const rootRow = page.locator('[data-ouia-component-id="workspaces-list"]').getByRole('row', { name: /Root Workspace/i });
      await expect(rootRow).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      // Root Workspace name is plain text, not a link (view permission denied)
      const rootLink = rootRow.getByRole('link', { name: /Root Workspace/i });
      await expect(rootLink).toHaveCount(0);
    });

    test('Root Workspace row actions are all disabled [Admin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      const rootRow = page.locator('[data-ouia-component-id="workspaces-list"]').getByRole('row', { name: /Root Workspace/i });
      const kebab = rootRow.getByLabel('Kebab toggle');
      await kebab.click();

      // All modification actions should be disabled for the root workspace
      const editItem = page.getByRole('menuitem', { name: /edit workspace/i });
      const deleteItem = page.getByRole('menuitem', { name: /delete workspace/i });
      const moveItem = page.getByRole('menuitem', { name: /move workspace/i });

      // All actions disabled via Kessel permission checks
      await expect(editItem).toBeDisabled({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
      await expect(deleteItem).toBeDisabled({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
      await expect(moveItem).toBeDisabled({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
    });

    test('Root Workspace is not selectable in Create Workspace parent selector [Admin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.createButton.click();
      await expect(page.getByRole('heading', { name: /create new workspace/i })).toBeVisible({
        timeout: E2E_TIMEOUTS.DIALOG_CONTENT,
      });

      // Open the parent workspace selector
      await page.getByRole('button', { name: /select workspaces/i }).click();
      const tree = page.getByRole('tree');
      await expect(tree.getByRole('treeitem').first()).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      // Root Workspace treeitem should be disabled (no create permission)
      const rootItem = tree.getByRole('treeitem').filter({ hasText: 'Root Workspace' }).first();

      // Root lacks create permission — should be disabled in the tree
      await expect(rootItem).toHaveAttribute('aria-disabled', 'true', { timeout: E2E_TIMEOUTS.TABLE_DATA });
    });
  });
});
