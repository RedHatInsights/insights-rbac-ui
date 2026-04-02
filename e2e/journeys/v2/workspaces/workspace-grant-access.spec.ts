/**
 * Workspace Grant Access Wizard Tests
 *
 * Tests for granting access (role bindings) to workspaces via the wizard.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It opens the grant access wizard (from toolbar or Actions menu)
 *   ✓ It completes the grant access wizard flow
 *   ✓ It cancels the grant access wizard
 *   ✓ It checks grant access availability per persona
 *
 * DO NOT add here if:
 *   ✗ It views workspace detail content → workspace-detail.spec.ts
 *   ✗ It manages role bindings (edit/remove) → workspace-role-bindings.spec.ts
 *   ✗ It tests workspace CRUD → workspace-management.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability Grant Access to Workspace
 * @personas
 *   - Admin: Can open and complete the grant access wizard
 *   - UserViewer: Grant access button absent or disabled
 *   - ReadOnlyUser: Cannot access workspace detail (unauthorized)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ORGADMIN, AUTH_V2_USERVIEWER, AUTH_V2_READONLY
 *   - DATA: Relies on SEEDED_WORKSPACE_NAME from seed-map
 *   - UTILS: Use WorkspacesPage for navigation and wizard interactions
 */

import { expect, test } from '@playwright/test';
import {
  AUTH_V2_ORGADMIN,
  AUTH_V2_READONLY,
  AUTH_V2_USERVIEWER,
  iamUrl,
  requireSeededChildGroupName,
  requireSeededRoleName,
  requireSeededWorkspaceName,
  setupPage,
  v2,
  waitForTableUpdate,
} from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';

const SEEDED_WORKSPACE_NAME = requireSeededWorkspaceName('v2');
const CHILD_GROUP_NAME = requireSeededChildGroupName('v2');
const SEEDED_ROLE_NAME = requireSeededRoleName('v2');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Workspace Grant Access', () => {
  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Can open grant access wizard from toolbar [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME);

      await workspacesPage.roleAssignmentsTab.click();
      await expect(workspacesPage.currentRoleAssignmentsTable).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });

      await workspacesPage.openGrantAccessWizard();
      await expect(workspacesPage.grantAccessWizard).toBeVisible();
    });

    test('Can open grant access wizard from Actions menu [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME);

      await workspacesPage.openGrantAccessFromActions();
      await expect(workspacesPage.grantAccessWizard).toBeVisible();
    });

    test('Can cancel grant access wizard [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME);

      await workspacesPage.roleAssignmentsTab.click();
      await expect(workspacesPage.currentRoleAssignmentsTable).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });

      await workspacesPage.openGrantAccessWizard();
      await workspacesPage.cancelGrantAccessWizard();

      // Still on detail page after cancel
      await expect(page.getByRole('heading', { name: SEEDED_WORKSPACE_NAME })).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Grant → Verify → Remove lifecycle (self-cleaning)
  // Uses CHILD_GROUP_NAME + SEEDED_ROLE_NAME — combo not in seed so net-zero change
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe.serial('OrgAdmin — Grant, verify, remove', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Grant access to seeded workspace [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME);

      await workspacesPage.roleAssignmentsTab.click();
      await expect(workspacesPage.currentRoleAssignmentsTable).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });

      await workspacesPage.openGrantAccessWizard();
      await workspacesPage.fillGrantAccessWizard({ groups: [CHILD_GROUP_NAME], roles: [SEEDED_ROLE_NAME] });
    });

    test('Verify granted group appears in role assignments [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME);

      await workspacesPage.roleAssignmentsTab.click();
      await waitForTableUpdate(page, { timeout: E2E_TIMEOUTS.SLOW_DATA });

      await expect(workspacesPage.currentRoleAssignmentsTable.getByText(CHILD_GROUP_NAME)).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });
    });

    test('Remove granted group from workspace [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME);

      await workspacesPage.roleAssignmentsTab.click();
      await waitForTableUpdate(page, { timeout: E2E_TIMEOUTS.SLOW_DATA });

      await workspacesPage.openRoleBindingActions(CHILD_GROUP_NAME);
      await page.getByRole('menuitem', { name: /remove/i }).click();
      await workspacesPage.confirmRemoveGroup();
    });

    test('Verify group removed from role assignments [OrgAdmin]', async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME);

      await workspacesPage.roleAssignmentsTab.click();
      await waitForTableUpdate(page, { timeout: E2E_TIMEOUTS.SLOW_DATA });

      await expect(workspacesPage.currentRoleAssignmentsTable.getByText(CHILD_GROUP_NAME)).not.toBeVisible({
        timeout: E2E_TIMEOUTS.TABLE_DATA,
      });
    });
  });

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test('Grant access is not available [UserViewer]', async ({ page }) => {
      await setupPage(page);
      await expect(async () => {
        await page.goto(iamUrl(v2.accessManagementWorkspaces.link()), { timeout: E2E_TIMEOUTS.SLOW_DATA });
        // All personas can now see the workspace list (gap-stopper for Kessel access check)
        await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
      // Grant Access wizard not accessible without permissions
      await expect(page.getByRole('button', { name: /grant access/i })).not.toBeVisible();
    });
  });

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V2_READONLY });

    test('Grant access is not available [ReadOnlyUser]', async ({ page }) => {
      await setupPage(page);
      await expect(async () => {
        await page.goto(iamUrl(v2.accessManagementWorkspaces.link()), { timeout: E2E_TIMEOUTS.SLOW_DATA });
        // All personas can now see the workspace list (gap-stopper for Kessel access check)
        await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      }).toPass({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD, intervals: [1_000, 2_000, 5_000] });
      // Grant Access wizard not accessible without permissions
      await expect(page.getByRole('button', { name: /grant access/i })).not.toBeVisible();
    });
  });
});
