/**
 * V2 Workspaces - View Tests
 *
 * Tests for viewing workspaces on the V2 Workspaces page.
 *
 * Personas: Admin, UserViewer
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_USERVIEWER, getSeededWorkspaceData, getSeededWorkspaceName } from '../../../utils';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';

const SEEDED_WORKSPACE_NAME = getSeededWorkspaceName('v2');
const SEEDED_WORKSPACE_DATA = getSeededWorkspaceData();

if (!SEEDED_WORKSPACE_NAME) {
  throw new Error('No seeded workspace found in seed map. Run: npm run e2e:seed:v2');
}

// ═══════════════════════════════════════════════════════════════════════════
// Personas
// ═══════════════════════════════════════════════════════════════════════════

const viewPersonas = [
  { name: 'Admin', auth: AUTH_V2_ADMIN },
  { name: 'UserViewer', auth: AUTH_V2_USERVIEWER },
];

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

viewPersonas.forEach(({ name, auth }) => {
  test.describe(name, () => {
    test.use({ storageState: auth });

    test(`Can view workspaces list [${name}]`, async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await expect(workspacesPage.table).toBeVisible();
    });

    test(`Can search for seeded workspace [${name}]`, async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.verifyWorkspaceInTable(SEEDED_WORKSPACE_NAME);
    });

    test(`Can view workspace detail page [${name}]`, async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME);

      // Verify description if available
      if (SEEDED_WORKSPACE_DATA?.description) {
        await expect(page.getByText(SEEDED_WORKSPACE_DATA.description)).toBeVisible({ timeout: 30000 });
      }
    });
  });
});
