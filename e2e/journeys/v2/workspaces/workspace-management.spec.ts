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
 *   - AUTH: Uses AUTH_V2_ORGADMIN from utils
 *   - UTILS: Use WorkspacesPage for UI interactions
 *   - PREFIX: Requires TEST_PREFIX_V2 env var for safe test isolation
 *
 * NOTE: Workspaces cannot be created at root level - must select a parent workspace.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN, AUTH_V2_RBACADMIN, getSeededWorkspaceName, requireTestPrefix, waitForTableUpdate } from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const TEST_PREFIX = requireTestPrefix('v2');
const SEEDED_WORKSPACE_NAME = getSeededWorkspaceName('v2');

// Generate unique name for this test run
const timestamp = Date.now();
const workspaceName = `${TEST_PREFIX}__Lifecycle_Workspace_${timestamp}`;
const workspaceDescription = 'E2E lifecycle test workspace';
const editedDescription = 'E2E lifecycle test workspace (edited)';
const editedWorkspaceName = `${workspaceName}_Edited`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Workspace Management', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full CRUD access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('OrgAdmin Lifecycle', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Create workspace [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.createButton.click();
      // Workspaces cannot be created at root level (yet)
      // Must select a child workspace as parent - use Default Workspace
      await workspacesPage.fillCreateModal(workspaceName, workspaceDescription, 'Default Workspace');
    });

    // Server-side caching can delay the workspace appearing in list results.
    // Poll with page reloads to tolerate eventual consistency.
    test('Verify workspace appears in table [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);

      await expect(async () => {
        await workspacesPage.goto();
        await workspacesPage.searchFor(workspaceName);
        await expect(workspacesPage.table.getByText(workspaceName)).toBeVisible();
      }).toPass({ timeout: E2E_TIMEOUTS.SLOW_DATA, intervals: [5_000] });
    });

    test('View workspace detail page [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);

      await expect(async () => {
        await workspacesPage.goto();
        await workspacesPage.searchFor(workspaceName);
        await workspacesPage.navigateToDetail(workspaceName);
        await expect(page.getByRole('heading', { name: workspaceName })).toBeVisible();
      }).toPass({ timeout: E2E_TIMEOUTS.SLOW_DATA, intervals: [5_000] });
    });

    test('Edit workspace description [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(workspaceName);
      await workspacesPage.navigateToDetail(workspaceName);

      // Wait for Actions to become enabled (backend permission propagation)
      const actionsButton = page.getByRole('button', { name: /actions/i });
      await expect(actionsButton).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(async () => {
        await actionsButton.click();
        await expect(page.getByRole('menuitem', { name: /edit/i })).toBeEnabled({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
      }).toPass({ timeout: E2E_TIMEOUTS.SLOW_DATA, intervals: [2_000] });

      await page.getByRole('menuitem', { name: /edit/i }).click();

      await workspacesPage.fillEditForm(editedDescription, editedWorkspaceName);
    });

    test('Verify edit was applied [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(editedWorkspaceName);
      await workspacesPage.navigateToDetail(editedWorkspaceName);

      await expect(page.getByText(editedDescription)).toBeVisible({ timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
    });

    test('Delete workspace [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(editedWorkspaceName);
      await workspacesPage.navigateToDetail(editedWorkspaceName);

      // Open Actions menu and click Delete
      await page.getByRole('button', { name: /actions/i }).click();
      await page.getByRole('menuitem', { name: /delete/i }).click();

      await workspacesPage.confirmDelete();
    });

    test('Verify workspace is deleted [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(editedWorkspaceName);
      await waitForTableUpdate(page);
      await workspacesPage.verifyWorkspaceNotInTable(editedWorkspaceName);
    });
  });

  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test(`Create Workspace button is visible [OrgAdmin]`, async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await expect(workspacesPage.createButton).toBeVisible();
    });

    test('Delete is disabled for workspace with children [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      await page.getByRole('button', { name: /actions/i }).click();
      // PatternFly uses HTML `disabled` attribute (not aria-disabled) on the menu button
      await expect(page.getByRole('menuitem', { name: /delete/i })).toBeDisabled({
        timeout: E2E_TIMEOUTS.MENU_ANIMATION,
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Admin - Create with Parent Selection
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('OrgAdmin - Create with Parent', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    const parentCreateTimestamp = Date.now();
    const parentCreateName = `${TEST_PREFIX}__Parent_Create_${parentCreateTimestamp}`;
    const parentCreateDescription = 'E2E create with parent test';

    test('Create workspace with specific parent [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.createButton.click();
      await workspacesPage.fillCreateModal(parentCreateName, parentCreateDescription, 'Default Workspace');
    });

    test('Verify workspace appears under correct parent [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);

      await expect(async () => {
        await workspacesPage.goto();
        await workspacesPage.expandTreeNodes();
        await workspacesPage.searchFor(parentCreateName);
        await expect(workspacesPage.table.getByText(parentCreateName)).toBeVisible();
      }).toPass({ timeout: E2E_TIMEOUTS.SLOW_DATA, intervals: [5_000] });
    });

    test('Delete workspace created with parent [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(parentCreateName);
      await workspacesPage.navigateToDetail(parentCreateName);

      await page.getByRole('button', { name: /actions/i }).click();
      await page.getByRole('menuitem', { name: /delete/i }).click();
      await workspacesPage.confirmDelete();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Admin - Create Subworkspace from Kebab
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('OrgAdmin - Create Subworkspace', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    const subworkspaceTimestamp = Date.now();
    const subworkspaceName = `${TEST_PREFIX}__Subworkspace_${subworkspaceTimestamp}`;
    const subworkspaceDescription = 'E2E subworkspace from kebab';

    test('Create subworkspace via kebab [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.openRowKebab('Default Workspace');
      await page.getByRole('menuitem', { name: /create sub-?workspace/i }).click();

      await workspacesPage.fillCreateModal(subworkspaceName, subworkspaceDescription, 'Default Workspace');
    });

    test('Delete subworkspace created via kebab [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await expect(async () => {
        await workspacesPage.goto();
        await workspacesPage.searchFor(subworkspaceName);
        await expect(workspacesPage.table.getByText(subworkspaceName)).toBeVisible();
      }).toPass({ timeout: E2E_TIMEOUTS.SLOW_DATA, intervals: [5_000] });

      await workspacesPage.searchFor(subworkspaceName);
      await workspacesPage.navigateToDetail(subworkspaceName);

      await page.getByRole('button', { name: /actions/i }).click();
      await page.getByRole('menuitem', { name: /delete/i }).click();
      await workspacesPage.confirmDelete();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RBACADMIN (WorkspaceAdmin) - Full workspace CRUD (rbac_workspace_*)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('RbacAdmin Lifecycle', () => {
    test.use({ storageState: AUTH_V2_RBACADMIN });

    const raTimestamp = Date.now();
    const raWorkspaceName = `${TEST_PREFIX}__RA_Workspace_${raTimestamp}`;
    const raWorkspaceDescription = 'E2E RbacAdmin lifecycle workspace';
    const raEditedDescription = 'E2E RbacAdmin lifecycle workspace (edited)';

    test('Create workspace [RbacAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.createButton.click();
      await workspacesPage.fillCreateModal(raWorkspaceName, raWorkspaceDescription, 'Default Workspace');
    });

    test('Verify workspace appears in table [RbacAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);

      await expect(async () => {
        await workspacesPage.goto();
        await workspacesPage.searchFor(raWorkspaceName);
        await expect(workspacesPage.table.getByText(raWorkspaceName)).toBeVisible();
      }).toPass({ timeout: E2E_TIMEOUTS.SLOW_DATA, intervals: [5_000] });
    });

    test('View workspace detail page [RbacAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(raWorkspaceName);
      await workspacesPage.navigateToDetail(raWorkspaceName);

      await expect(page.getByRole('heading', { name: raWorkspaceName })).toBeVisible();
    });

    test('Edit workspace description [RbacAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(raWorkspaceName);
      await workspacesPage.navigateToDetail(raWorkspaceName);

      await page.getByRole('button', { name: /actions/i }).click();
      await page.getByRole('menuitem', { name: /edit/i }).click();

      await workspacesPage.fillEditForm(raEditedDescription);
    });

    test('Verify edit was applied [RbacAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(raWorkspaceName);
      await workspacesPage.navigateToDetail(raWorkspaceName);

      await expect(page.getByText(raEditedDescription)).toBeVisible({ timeout: E2E_TIMEOUTS.MUTATION_COMPLETE });
    });

    test('Delete workspace [RbacAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(raWorkspaceName);
      await workspacesPage.navigateToDetail(raWorkspaceName);

      await page.getByRole('button', { name: /actions/i }).click();
      await page.getByRole('menuitem', { name: /delete/i }).click();

      await workspacesPage.confirmDelete();
    });

    test('Verify workspace is deleted [RbacAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(raWorkspaceName);
      await waitForTableUpdate(page);
      await workspacesPage.verifyWorkspaceNotInTable(raWorkspaceName);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Admin - Move Workspace
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('OrgAdmin - Move Workspace', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    const moveTimestamp = Date.now();
    const moveWorkspaceName = `${TEST_PREFIX}__Move_Workspace_${moveTimestamp}`;
    const moveWorkspaceDescription = 'E2E move workspace test';

    test('Move workspace to different parent [OrgAdmin]', async ({ page }) => {
      test.info().annotations.push({ type: 'move-target', description: `Moving "${moveWorkspaceName}" to Root Workspace` });
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      // Create workspace under Default Workspace first
      await workspacesPage.createButton.click();
      await workspacesPage.fillCreateModal(moveWorkspaceName, moveWorkspaceDescription, 'Default Workspace');

      await expect(async () => {
        await workspacesPage.goto();
        await workspacesPage.searchFor(moveWorkspaceName);
        await expect(workspacesPage.table.getByText(moveWorkspaceName)).toBeVisible();
      }).toPass({ timeout: E2E_TIMEOUTS.SLOW_DATA, intervals: [5_000] });

      // Permissions propagate asynchronously — retry until Move is enabled
      await expect(async () => {
        await workspacesPage.goto();
        await workspacesPage.searchFor(moveWorkspaceName);
        await workspacesPage.openRowKebab(moveWorkspaceName);
        await expect(page.getByRole('menuitem', { name: /move workspace/i })).toBeEnabled();
      }).toPass({ timeout: E2E_TIMEOUTS.SLOW_DATA, intervals: [3_000] });

      await page.getByRole('menuitem', { name: /move workspace/i }).click();

      await workspacesPage.fillMoveModal('Root Workspace');

      await expect(async () => {
        await workspacesPage.goto();
        await workspacesPage.expandTreeNodes();
        await workspacesPage.searchFor(moveWorkspaceName);
        await expect(workspacesPage.table.getByText(moveWorkspaceName)).toBeVisible();
      }).toPass({ timeout: E2E_TIMEOUTS.SLOW_DATA, intervals: [5_000] });
    });

    test('Delete workspace after move [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(moveWorkspaceName);
      await workspacesPage.navigateToDetail(moveWorkspaceName);

      await page.getByRole('button', { name: /actions/i }).click();
      await page.getByRole('menuitem', { name: /delete/i }).click();
      await workspacesPage.confirmDelete();
    });
  });
});
