/**
 * Workspace List Tests
 *
 * Tests for the workspaces table/list view.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It tests table visibility or structure
 *   ✓ It tests search/filter functionality
 *   ✓ It tests sorting or pagination
 *   ✓ It tests column visibility or ordering
 *
 * DO NOT add here if:
 *   ✗ It creates, edits, or deletes a workspace → workspace-management.spec.ts
 *   ✗ It views workspace detail page content → workspace-detail.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View Workspaces List, Search Workspaces, Filter Workspaces
 * @personas
 *   - Admin: Full list access
 *   - UserViewer: Full list access
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ADMIN, AUTH_V2_USERVIEWER from utils
 *   - DATA: Relies on SEEDED_WORKSPACE_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use WorkspacesPage for table interactions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_USERVIEWER, getSeededWorkspaceName } from '../../../utils';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';

const SEEDED_WORKSPACE_NAME = getSeededWorkspaceName('v2');

if (!SEEDED_WORKSPACE_NAME) {
  throw new Error('No seeded workspace found in seed map. Run: npm run e2e:seed:v2');
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Workspace List', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full list access
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
  // USERVIEWER - Full list access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test(`Can view workspaces list [UserViewer]`, async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await expect(workspacesPage.table).toBeVisible();
    });

    test(`Can search for seeded workspace [UserViewer]`, async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.verifyWorkspaceInTable(SEEDED_WORKSPACE_NAME);
    });
  });
});
