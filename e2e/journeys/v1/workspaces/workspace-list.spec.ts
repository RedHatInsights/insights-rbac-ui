/**
 * V1 Workspace List Tests
 *
 * Tests for the V1 workspaces page access and unauthorized access checks.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It tests access to the V1 workspaces page
 *   ✓ It tests viewing the workspaces list
 *   ✓ It verifies unauthorized access for non-admin personas
 *
 * DO NOT add here if:
 *   ✗ V2 workspace tests → v2/workspaces/workspace-*.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability View Workspaces
 * @personas
 *   - Admin: Full access to the workspaces page
 *   - UserViewer: Page blocked entirely (unauthorized message)
 *   - ReadOnlyUser: Page blocked entirely (unauthorized message)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V1_ADMIN, AUTH_V1_USERVIEWER, AUTH_V1_READONLY from utils
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_ADMIN, AUTH_V1_READONLY, AUTH_V1_USERVIEWER, setupPage } from '../../../utils';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const WORKSPACES_URL = '/iam/user-access/workspaces';

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('V1 Workspace List', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Full access
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin', () => {
    test.use({ storageState: AUTH_V1_ADMIN });

    test(`Can access Workspaces page [Admin]`, async ({ page }) => {
      const workspacesPage = new WorkspacesPage(page, 'v1');
      await workspacesPage.goto();

      await expect(workspacesPage.table).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V1_USERVIEWER });

    test(`Workspaces page shows unauthorized access [UserViewer]`, async ({ page }) => {
      await setupPage(page);
      await page.goto(WORKSPACES_URL);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // READONLYUSER - No page access at all
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('ReadOnlyUser', () => {
    test.use({ storageState: AUTH_V1_READONLY });

    test(`Workspaces page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
      await setupPage(page);
      await page.goto(WORKSPACES_URL);

      await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });
});
