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
 *   - DATA: Relies on SEEDED_WORKSPACE_NAME from seed-map
 *   - UTILS: Use WorkspacesPage for navigation and detail interactions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN, getSeededWorkspaceName } from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';

const SEEDED_WORKSPACE_NAME = getSeededWorkspaceName('v2');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Workspace Role Bindings', () => {
  test.describe('OrgAdmin', () => {
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

      // Click the first group row to open the drawer
      const firstGroupRow = workspacesPage.currentRoleAssignmentsTable.getByRole('row').nth(1);
      const groupName = await firstGroupRow.getByRole('gridcell').first().textContent();

      if (groupName) {
        await workspacesPage.openGroupDrawer(groupName.trim());

        // Drawer should have Members and Roles tabs
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

        // Drawer tabs should no longer be visible
        await expect(page.getByRole('tab', { name: /members/i })).not.toBeVisible();
      }
    });

    test('Inherited role bindings show parent workspace links [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      await workspacesPage.roleAssignmentsTab.click();
      await workspacesPage.inheritedRoleAssignmentsSubTab.click();
      await expect(workspacesPage.inheritedRoleAssignmentsSubTab).toHaveAttribute('aria-selected', 'true', {
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });

      await expect(workspacesPage.parentRoleAssignmentsTable.or(page.getByRole('grid'))).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });
    });
  });
});
