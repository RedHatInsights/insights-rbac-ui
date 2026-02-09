/**
 * Workspace Detail Tests
 *
 * Tests for viewing workspace detail pages.
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
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View Workspace Detail, Navigate to Related Entities
 * @personas
 *   - Admin: Full detail access
 *   - UserViewer: Full detail access
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ADMIN, AUTH_V2_USERVIEWER from utils
 *   - DATA: Relies on SEEDED_WORKSPACE_NAME from seed-map (created in e2e:seed)
 *   - UTILS: Use WorkspacesPage for navigation and assertions
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_USERVIEWER, getSeededWorkspaceData, getSeededWorkspaceName } from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';

const SEEDED_WORKSPACE_NAME = getSeededWorkspaceName('v2');
const SEEDED_WORKSPACE_DATA = getSeededWorkspaceData();

if (!SEEDED_WORKSPACE_NAME) {
  throw new Error('No seeded workspace found in seed map. Run: npm run e2e:seed:v2');
}

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Workspace Detail', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full detail access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test(`Can view workspace detail page [Admin]`, async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME);

      // Verify description if available
      if (SEEDED_WORKSPACE_DATA?.description) {
        await expect(page.getByText(SEEDED_WORKSPACE_DATA.description)).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - Full detail access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    test(`Can view workspace detail page [UserViewer]`, async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page);
      await workspacesPage.goto();

      await workspacesPage.searchFor(SEEDED_WORKSPACE_NAME);
      await workspacesPage.navigateToDetail(SEEDED_WORKSPACE_NAME);

      // Verify description if available
      if (SEEDED_WORKSPACE_DATA?.description) {
        await expect(page.getByText(SEEDED_WORKSPACE_DATA.description)).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
      }
    });
  });
});
