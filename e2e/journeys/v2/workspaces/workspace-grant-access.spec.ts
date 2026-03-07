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
import { AUTH_V2_ORGADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER, getSeededWorkspaceName, iamUrl, setupPage, v2 } from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';

const SEEDED_WORKSPACE_NAME = getSeededWorkspaceName('v2');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Workspace Grant Access', () => {
  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Can open grant access wizard from toolbar [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      await workspacesPage.roleAssignmentsTab.click();
      await expect(workspacesPage.currentRoleAssignmentsTable.or(page.getByRole('grid'))).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });

      await workspacesPage.openGrantAccessWizard();
      await expect(workspacesPage.grantAccessWizard).toBeVisible();
    });

    test('Can open grant access wizard from Actions menu [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      await workspacesPage.openGrantAccessFromActions();
      await expect(workspacesPage.grantAccessWizard).toBeVisible();
    });

    test('Can cancel grant access wizard [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      await workspacesPage.roleAssignmentsTab.click();
      await expect(workspacesPage.currentRoleAssignmentsTable.or(page.getByRole('grid'))).toBeVisible({
        timeout: E2E_TIMEOUTS.SLOW_DATA,
      });

      await workspacesPage.openGrantAccessWizard();
      await workspacesPage.cancelGrantAccessWizard();

      // Still on detail page after cancel
      await expect(page.getByRole('heading', { name: SEEDED_WORKSPACE_NAME! })).toBeVisible();
    });
  });

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test('Grant access is not available [UserViewer]', async ({ page }) => {
      test.fixme(true, 'APP BUG: UserViewer navigating to workspaces URL sees My Access instead of UnauthorizedAccess page');
      await setupPage(page);
      await page.goto(iamUrl(v2.accessManagementWorkspaces.link()));

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
    });
  });

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V2_READONLY });

    test('Grant access is not available [ReadOnlyUser]', async ({ page }) => {
      test.fixme(true, 'APP BUG: ReadOnlyUser navigating to workspaces URL sees My Access instead of UnauthorizedAccess page');
      await setupPage(page);
      await page.goto(iamUrl(v2.accessManagementWorkspaces.link()));

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
    });
  });
});
