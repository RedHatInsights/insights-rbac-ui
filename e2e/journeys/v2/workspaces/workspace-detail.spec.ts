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
import { AUTH_V2_ORGADMIN, AUTH_V2_WORKSPACEUSER, getSeededWorkspaceData, getSeededWorkspaceName } from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';

const SEEDED_WORKSPACE_NAME = getSeededWorkspaceName('v2');
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

    test('Parent workspace shows empty inherited tab [OrgAdmin]', async ({ page }) => {
      test.skip(!SEEDED_WORKSPACE_NAME, 'No seed data — run npm run e2e:seed:v2');
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME!);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME!);

      await workspacesPage.switchToInheritedTab();

      await expect(page.getByText(/no user group found/i)).toBeVisible({
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
  });

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
  });
});
