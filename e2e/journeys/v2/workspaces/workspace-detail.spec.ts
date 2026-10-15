/**
 * Workspace Detail Tests
 *
 * Tests for viewing workspace detail pages (Admin only).
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It views workspace detail page content (heading, description)
 *   ✓ It navigates from workspace detail to related entities
 *   ✓ It tests tab switching on the detail page
 *
 * DO NOT add here if:
 *   ✗ It creates, edits, or deletes a workspace → workspace-management.spec.ts
 *   ✗ It tests the workspaces table/list view → workspace-list.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ORGADMIN from utils
 *   - DATA: Relies on SEEDED_WORKSPACE_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use WorkspacesPage for navigation and assertions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN, AUTH_V2_WORKSPACEUSER, getSeededChildWorkspaceName, getSeededWorkspaceData, getSeededWorkspaceName } from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';

const SEEDED_WORKSPACE_NAME = getSeededWorkspaceName('v2');
const SEEDED_CHILD_WORKSPACE_NAME = getSeededChildWorkspaceName('v2');
const SEEDED_WORKSPACE_DATA = getSeededWorkspaceData('v2');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Workspace Detail', () => {
  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test(`Can view workspace detail page [OrgAdmin]`, async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      // Verify description if available
      if (SEEDED_WORKSPACE_DATA?.description) {
        await expect(page.getByText(SEEDED_WORKSPACE_DATA.description)).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      }
    });

    test('Can view workspace roles tab [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      const rolesTab = page.getByRole('tab', { name: /role assignments/i });
      await expect(rolesTab).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      await rolesTab.click();
      await expect(rolesTab).toHaveAttribute('aria-selected', 'true', { timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(page.locator('[data-ouia-component-id="current-role-assignments-table"]').or(page.getByRole('grid'))).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });
    });

    test('Inherited tab shows inherited roles from parent workspaces [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      await workspacesPage.switchToInheritedTab();

      await expect(workspacesPage.parentRoleAssignmentsTable.getByRole('row')).not.toHaveCount(0, {
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });
    });

    test('Can view workspace assets tab [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      const assetsTab = page.getByRole('tab', { name: /^assets$/i });
      await assetsTab.click();
      await expect(assetsTab).toHaveAttribute('aria-selected', 'true', { timeout: E2E_TIMEOUTS.SLOW_DATA });
      await expect(page.getByText(/navigate to a service|manage your assets|red hat insights/i).first()).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });
    });

    test('Actions menu is visible and contains expected items [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      const actionsButton = page.getByRole('button', { name: /^actions$/i }).first();
      await expect(actionsButton).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      await actionsButton.click();

      // Verify expected menu items appear
      await expect(page.getByRole('menuitem', { name: /edit workspace/i })).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
      await expect(page.getByRole('menuitem', { name: /move workspace/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /delete workspace/i })).toBeVisible();
      await expect(page.getByRole('menuitem', { name: /grant access/i })).toBeVisible();
    });

    test('Workspace hierarchy breadcrumb displays full path [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      // Verify breadcrumb section is visible
      await expect(page.getByText(/workspace hierarchy/i)).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

      // Verify hierarchy path shows (at minimum Root → Default → Seeded Workspace)
      // Find the breadcrumb that comes after "Workspace hierarchy:" text
      const hierarchySection = page.locator('text=/Workspace hierarchy/i').locator('..');
      const breadcrumb = hierarchySection.locator('nav');
      await expect(breadcrumb.getByText('Root Workspace')).toBeVisible();
      await expect(breadcrumb.getByText('Default Workspace')).toBeVisible();
      await expect(breadcrumb.getByText(SEEDED_WORKSPACE_NAME!)).toBeVisible();
    });

    test('Can navigate hierarchy via breadcrumb to parent workspace [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      // Click on "Default Workspace" in hierarchy breadcrumb
      const hierarchySection = page.locator('text=/Workspace hierarchy/i').locator('..');
      const breadcrumb = hierarchySection.locator('nav');
      const defaultWorkspaceLink = breadcrumb.getByRole('link', { name: 'Default Workspace' });
      await expect(defaultWorkspaceLink).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      await defaultWorkspaceLink.click();

      // Verify navigated to Default Workspace detail page
      await expect(page.getByRole('heading', { name: 'Default Workspace', level: 1 })).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
    });

    test('Can navigate hierarchy via breadcrumb to root workspace [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      // Click on "Root Workspace" in hierarchy breadcrumb
      const hierarchySection = page.locator('text=/Workspace hierarchy/i').locator('..');
      const breadcrumb = hierarchySection.locator('nav');
      const rootWorkspaceLink = breadcrumb.getByRole('link', { name: 'Root Workspace' });
      await expect(rootWorkspaceLink).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      await rootWorkspaceLink.click();

      // Verify navigated to Root Workspace detail page
      await expect(page.getByRole('heading', { name: 'Root Workspace', level: 1 })).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
    });

    test('Nested workspace (4 levels) shows full hierarchy breadcrumb [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_CHILD_WORKSPACE_NAME, 'No child workspace seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      // Navigate to the child workspace (4 levels deep: Root → Default → Seeded → Child)
      await workspacesPage.navigateToChildWorkspace(SEEDED_WORKSPACE_NAME!, SEEDED_CHILD_WORKSPACE_NAME!);

      // Verify breadcrumb shows all 4 levels
      await expect(page.getByText(/workspace hierarchy/i)).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

      const hierarchySection = page.locator('text=/Workspace hierarchy/i').locator('..');
      const breadcrumb = hierarchySection.locator('nav');
      await expect(breadcrumb.getByText('Root Workspace')).toBeVisible();
      await expect(breadcrumb.getByText('Default Workspace')).toBeVisible();
      await expect(breadcrumb.getByText(SEEDED_WORKSPACE_NAME!)).toBeVisible();
      await expect(breadcrumb.getByText(SEEDED_CHILD_WORKSPACE_NAME!)).toBeVisible();
    });

    test('Can walk nested hierarchy from child to root via breadcrumb [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_CHILD_WORKSPACE_NAME, 'No child workspace seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      // Start at child workspace (deepest level)
      await workspacesPage.navigateToChildWorkspace(SEEDED_WORKSPACE_NAME!, SEEDED_CHILD_WORKSPACE_NAME!);

      // Step 1: Navigate to parent (Seeded Workspace)
      let hierarchySection = page.locator('text=/Workspace hierarchy/i').locator('..');
      let breadcrumb = hierarchySection.locator('nav');
      const seededWorkspaceLink = breadcrumb.getByRole('link', { name: SEEDED_WORKSPACE_NAME! });
      await expect(seededWorkspaceLink).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      await seededWorkspaceLink.click();
      await expect(page.getByRole('heading', { name: SEEDED_WORKSPACE_NAME!, level: 1 })).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

      // Step 2: Navigate to grandparent (Default Workspace)
      hierarchySection = page.locator('text=/Workspace hierarchy/i').locator('..');
      breadcrumb = hierarchySection.locator('nav');
      const defaultWorkspaceLink = breadcrumb.getByRole('link', { name: 'Default Workspace' });
      await expect(defaultWorkspaceLink).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      await defaultWorkspaceLink.click();
      await expect(page.getByRole('heading', { name: 'Default Workspace', level: 1 })).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

      // Step 3: Navigate to root
      hierarchySection = page.locator('text=/Workspace hierarchy/i').locator('..');
      breadcrumb = hierarchySection.locator('nav');
      const rootWorkspaceLink = breadcrumb.getByRole('link', { name: 'Root Workspace' });
      await expect(rootWorkspaceLink).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      await rootWorkspaceLink.click();
      await expect(page.getByRole('heading', { name: 'Root Workspace', level: 1 })).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
    });

    test('Actions menu items are disabled for Root workspace [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      // Navigate to Root Workspace via search or direct click
      await page.getByText('Root Workspace', { exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Root Workspace', level: 1 })).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

      // Open Actions menu
      const actionsButton = page.getByRole('button', { name: /^actions$/i }).first();
      await expect(actionsButton).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      await actionsButton.click();

      // Verify Edit, Move, and Delete are disabled (protected workspace)
      await expect(page.getByRole('menuitem', { name: /edit workspace/i })).toBeDisabled();
      await expect(page.getByRole('menuitem', { name: /move workspace/i })).toBeDisabled();
      await expect(page.getByRole('menuitem', { name: /delete workspace/i })).toBeDisabled();
    });

    test('Assets tab link points to correct inventory URL [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      // Navigate to Assets tab
      const assetsTab = page.getByRole('tab', { name: /^assets$/i });
      await assetsTab.click();
      await expect(assetsTab).toHaveAttribute('aria-selected', 'true', { timeout: E2E_TIMEOUTS.SLOW_DATA });

      // Verify inventory link has correct href with workspace parameter
      const inventoryLink = page.getByRole('link', { name: /red hat insights/i });
      await expect(inventoryLink).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });

      const href = await inventoryLink.getAttribute('href');
      expect(href).toContain('/insights/inventory');

      // Parse URL to properly check workspace parameter (handles URL encoding)
      const url = new URL(href!, 'https://console.stage.redhat.com');
      const workspaceParam = url.searchParams.get('workspace');
      expect(workspaceParam).toBe(SEEDED_WORKSPACE_NAME);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKSPACEUSER (WorkspaceViewer) - Read-only workspace detail
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('WorkspaceUser', () => {
    test.use({ storageState: AUTH_V2_WORKSPACEUSER });

    test('Can view workspace detail for permitted workspace [WorkspaceUser]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      if (SEEDED_WORKSPACE_DATA?.description) {
        await expect(page.getByText(SEEDED_WORKSPACE_DATA.description)).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      }
    });

    test('Actions menu is not visible on workspace detail [WorkspaceUser]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);
      await expect(page.getByRole('button', { name: /actions/i })).not.toBeVisible();
    });

    test('Grant access button is not visible on workspace detail [WorkspaceUser]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);
      await expect(workspacesPage.grantAccessButton).not.toBeVisible();
    });
  });
});
