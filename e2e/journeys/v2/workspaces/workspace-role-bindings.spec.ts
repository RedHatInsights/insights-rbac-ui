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
import { AUTH_V2_ORGADMIN, getSeededChildGroupName, getSeededChildWorkspaceName, getSeededGroupName, getSeededWorkspaceName } from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';

const SEEDED_WORKSPACE_NAME = getSeededWorkspaceName('v2');
const SEEDED_CHILD_WORKSPACE_NAME = getSeededChildWorkspaceName('v2');
const SEEDED_GROUP_NAME = getSeededGroupName('v2');
const CHILD_GROUP_NAME = getSeededChildGroupName('v2');

const HAS_CHILD_DATA = !!(SEEDED_WORKSPACE_NAME && SEEDED_CHILD_WORKSPACE_NAME && SEEDED_GROUP_NAME && CHILD_GROUP_NAME);

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Workspace Role Bindings', () => {
  test.describe('OrgAdmin — Direct role bindings', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Can view group details drawer from role assignments [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      await workspacesPage.roleAssignmentsTab.click();
      await expect(workspacesPage.currentRoleAssignmentsTable.or(page.getByRole('grid'))).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });

      const firstGroupRow = workspacesPage.currentRoleAssignmentsTable.getByRole('row').nth(1);
      const groupName = await firstGroupRow.getByRole('gridcell').first().textContent();

      if (groupName) {
        await workspacesPage.openGroupDrawer(groupName.trim());

        await expect(page.getByRole('tab', { name: /members/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /roles/i })).toBeVisible();
      }
    });

    test('Can close group details drawer [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      await workspacesPage.roleAssignmentsTab.click();
      await expect(workspacesPage.currentRoleAssignmentsTable.or(page.getByRole('grid'))).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });

      const firstGroupRow = workspacesPage.currentRoleAssignmentsTable.getByRole('row').nth(1);
      const groupName = await firstGroupRow.getByRole('gridcell').first().textContent();

      if (groupName) {
        await workspacesPage.openGroupDrawer(groupName.trim());
        await workspacesPage.closeGroupDrawer();

        await expect(page.getByRole('tab', { name: /members/i })).not.toBeVisible();
      }
    });
  });

  test.describe('OrgAdmin — Inherited role bindings', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Child workspace shows inherited groups from parent [OrgAdmin]', async ({ page }) => {
      test.skip(!HAS_CHILD_DATA, 'No child workspace seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.navigateToChildWorkspace(SEEDED_WORKSPACE_NAME!, SEEDED_CHILD_WORKSPACE_NAME!);
      await workspacesPage.switchToInheritedTab();

      await workspacesPage.expectInheritedGroupRow(SEEDED_GROUP_NAME!);
    });

    test('"Inherited from" column shows parent workspace link [OrgAdmin]', async ({ page }) => {
      test.skip(!HAS_CHILD_DATA, 'No child workspace seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.navigateToChildWorkspace(SEEDED_WORKSPACE_NAME!, SEEDED_CHILD_WORKSPACE_NAME!);
      await workspacesPage.switchToInheritedTab();

      await workspacesPage.expectInheritedFromColumn(SEEDED_GROUP_NAME!, SEEDED_WORKSPACE_NAME!);
    });

    test('Inherited group row opens details drawer [OrgAdmin]', async ({ page }) => {
      test.skip(!HAS_CHILD_DATA, 'No child workspace seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.navigateToChildWorkspace(SEEDED_WORKSPACE_NAME!, SEEDED_CHILD_WORKSPACE_NAME!);
      await workspacesPage.switchToInheritedTab();

      await workspacesPage.openGroupDrawer(SEEDED_GROUP_NAME!);

      await expect(page.getByRole('tab', { name: /members/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /roles/i })).toBeVisible();
    });

    test('Drawer roles tab shows "Inherited from" column [OrgAdmin]', async ({ page }) => {
      test.skip(!HAS_CHILD_DATA, 'No child workspace seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.navigateToChildWorkspace(SEEDED_WORKSPACE_NAME!, SEEDED_CHILD_WORKSPACE_NAME!);
      await workspacesPage.switchToInheritedTab();

      await workspacesPage.openGroupDrawer(SEEDED_GROUP_NAME!);

      const rolesTab = page.getByRole('tab', { name: /roles/i });
      await rolesTab.click();
      await expect(rolesTab).toHaveAttribute('aria-selected', 'true', { timeout: E2E_TIMEOUTS.SLOW_DATA });

      await expect(page.getByRole('columnheader', { name: /inherited from/i })).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });
    });

    test('Direct-only groups do NOT appear in inherited tab [OrgAdmin]', async ({ page }) => {
      test.skip(!HAS_CHILD_DATA, 'No child workspace seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.navigateToChildWorkspace(SEEDED_WORKSPACE_NAME!, SEEDED_CHILD_WORKSPACE_NAME!);
      await workspacesPage.switchToInheritedTab();

      await workspacesPage.expectGroupNotInInheritedTab(CHILD_GROUP_NAME!);
    });
  });
});
