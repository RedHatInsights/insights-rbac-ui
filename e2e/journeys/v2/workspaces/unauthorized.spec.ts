/**
 * V2 Workspaces - Read-Only Access Tests
 *
 * Tests for users who have READ but not WRITE access to the Workspaces page.
 * ReadOnlyUser can VIEW workspaces but cannot create or delete them.
 *
 * Personas: ReadOnlyUser
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_READONLY } from '../../../utils';
import { WorkspacesPage } from '../../../pages/v2/WorkspacesPage';

// ═══════════════════════════════════════════════════════════════════════════
// ReadOnlyUser - Read-Only Access
// ═══════════════════════════════════════════════════════════════════════════

test.describe('ReadOnlyUser', () => {
  test.use({ storageState: AUTH_V2_READONLY });

  test(`Can view workspaces but cannot create [ReadOnlyUser]`, async ({ page }) => {
    const workspacesPage = new WorkspacesPage(page);
    await workspacesPage.goto();

    // ReadOnlyUser CAN view the workspaces table
    await expect(workspacesPage.table).toBeVisible();

    // But Create workspace button is disabled
    await expect(workspacesPage.createButton).toBeDisabled();
  });
});
