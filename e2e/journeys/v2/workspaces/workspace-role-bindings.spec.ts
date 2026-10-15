/**
 * Workspace Role Bindings Management Tests
 *
 * Tests for viewing and managing role bindings on workspace detail pages.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It opens the group details drawer from role assignments
 *   ✓ It removes a group from a workspace
 *   ✓ It verifies inherited role binding display
 *
 * DO NOT add here if:
 *   ✗ It grants access via the wizard → workspace-grant-access.spec.ts
 *   ✗ It views workspace detail content → workspace-detail.spec.ts
 *   ✗ It tests workspace CRUD → workspace-management.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability Workspace Role Bindings
 * @personas
 *   - Admin: Can view drawer, manage role bindings
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ORGADMIN
 *   - DATA: Relies on SEEDED_WORKSPACE_NAME + SEEDED_CHILD_WORKSPACE_NAME from seed-map
 *   - SEED: "Seeded Group" bound to parent workspace; "Child Group" bound to child workspace.
 *           Child workspace inherits "Seeded Group" from parent.
 *   - UTILS: Use WorkspacesPage for navigation and detail interactions
 */

import { expect, test } from '@playwright/test';
import {
  AUTH_V2_ORGADMIN,
  requireSeededChildGroupName,
  requireSeededChildWorkspaceName,
  requireSeededGroupName,
  requireSeededWorkspaceName,
  waitForTableUpdate,
} from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';

const SEEDED_WORKSPACE_NAME = requireSeededWorkspaceName('v2');
const SEEDED_CHILD_WORKSPACE_NAME = requireSeededChildWorkspaceName('v2');
const SEEDED_GROUP_NAME = requireSeededGroupName('v2');
const CHILD_GROUP_NAME = requireSeededChildGroupName('v2');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Workspace Role Bindings', () => {
  test.describe('OrgAdmin — Direct role bindings', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Seeded workspace shows seeded group in role assignments [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME);

      await workspacesPage.roleAssignmentsTab.click();
      await waitForTableUpdate(page, { timeout: E2E_TIMEOUTS.SLOW_DATA });

      await expect(workspacesPage.currentRoleAssignmentsTable.getByText(SEEDED_GROUP_NAME)).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });
    });

    test('Child workspace shows child group in role assignments [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.navigateToChildWorkspace(SEEDED_WORKSPACE_NAME, SEEDED_CHILD_WORKSPACE_NAME);

      await workspacesPage.roleAssignmentsTab.click();
      await waitForTableUpdate(page, { timeout: E2E_TIMEOUTS.SLOW_DATA });

      await expect(workspacesPage.currentRoleAssignmentsTable.getByText(CHILD_GROUP_NAME)).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });
    });

    test('Can view group details drawer from role assignments [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME);

      await workspacesPage.roleAssignmentsTab.click();
      await waitForTableUpdate(page, { timeout: E2E_TIMEOUTS.SLOW_DATA });

      await workspacesPage.openGroupDrawer(SEEDED_GROUP_NAME);

      await expect(page.getByRole('tab', { name: /^users$/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /^roles$/i })).toBeVisible();
    });

    test('Can close group details drawer [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME);

      await workspacesPage.roleAssignmentsTab.click();
      await waitForTableUpdate(page, { timeout: E2E_TIMEOUTS.SLOW_DATA });

      await workspacesPage.openGroupDrawer(SEEDED_GROUP_NAME);
      await workspacesPage.closeGroupDrawer();

      await expect(page.getByRole('tab', { name: /^users$/i })).not.toBeVisible();
    });
  });

  test.describe('OrgAdmin — Inherited role bindings', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Child workspace shows inherited groups from parent [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.navigateToChildWorkspace(SEEDED_WORKSPACE_NAME, SEEDED_CHILD_WORKSPACE_NAME);
      await workspacesPage.switchToInheritedTab();

      await workspacesPage.expectInheritedGroupRow(SEEDED_GROUP_NAME);
    });

    test('"Inherited from" column shows parent workspace link [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.navigateToChildWorkspace(SEEDED_WORKSPACE_NAME, SEEDED_CHILD_WORKSPACE_NAME);
      await workspacesPage.switchToInheritedTab();

      await workspacesPage.expectInheritedFromColumn(SEEDED_GROUP_NAME, SEEDED_WORKSPACE_NAME);
    });

    test('Inherited group row opens details drawer [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.navigateToChildWorkspace(SEEDED_WORKSPACE_NAME, SEEDED_CHILD_WORKSPACE_NAME);
      await workspacesPage.switchToInheritedTab();

      await workspacesPage.openGroupDrawer(SEEDED_GROUP_NAME, workspacesPage.parentRoleAssignmentsTable);

      await expect(page.getByRole('tab', { name: /^users$/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /^roles$/i })).toBeVisible();
    });

    test('Drawer roles tab shows parent workspace in "Inherited from" cell [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.navigateToChildWorkspace(SEEDED_WORKSPACE_NAME, SEEDED_CHILD_WORKSPACE_NAME);
      await workspacesPage.switchToInheritedTab();

      await workspacesPage.openGroupDrawer(SEEDED_GROUP_NAME, workspacesPage.parentRoleAssignmentsTable);

      const rolesTab = page.getByRole('tab', { name: /^roles$/i });
      await rolesTab.click();
      await expect(rolesTab).toHaveAttribute('aria-selected', 'true', { timeout: E2E_TIMEOUTS.SLOW_DATA });

      // Check the parent workspace name appears in the drawer's Roles table
      // (the "Inherited from" column should link back to the workspace where the role was assigned)
      await expect(page.getByTestId('detail-drawer-panel').getByText(SEEDED_WORKSPACE_NAME)).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });
    });

    test('Direct-only groups do NOT appear in inherited tab [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.navigateToChildWorkspace(SEEDED_WORKSPACE_NAME, SEEDED_CHILD_WORKSPACE_NAME);
      await workspacesPage.switchToInheritedTab();

      await workspacesPage.expectGroupNotInInheritedTab(CHILD_GROUP_NAME);
    });
  });
});
