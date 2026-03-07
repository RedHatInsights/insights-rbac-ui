/**
 * V2 My User Access - View Tests
 *
 * Tests for the My User Access page.
 * All personas can access this page.
 *
 * Personas: Admin, UserViewer, ReadOnlyUser
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER, AUTH_V2_WORKSPACEUSER } from '../../utils';
import { MyUserAccessPage } from '../../pages/v2/MyUserAccessPage';
import { E2E_TIMEOUTS } from '../../utils/timeouts';

// ═══════════════════════════════════════════════════════════════════════════
// Personas - All can access
// ═══════════════════════════════════════════════════════════════════════════

const allPersonas = [
  { name: 'Admin', auth: AUTH_V2_ORGADMIN },
  { name: 'UserViewer', auth: AUTH_V2_USERVIEWER },
  { name: 'ReadOnlyUser', auth: AUTH_V2_READONLY },
];

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

allPersonas.forEach(({ name, auth }) => {
  test.describe(name, () => {
    test.use({ storageState: auth });

    test(`Can access My User Access page [${name}]`, async ({ page }) => {
      const myUserAccessPage = new MyUserAccessPage(page);
      await myUserAccessPage.goto();
      await myUserAccessPage.verifyPageLoaded();
    });
  });
});

test.describe('WorkspaceUser', () => {
  test.use({ storageState: AUTH_V2_WORKSPACEUSER });

  test('Can access My Access page [WorkspaceUser]', async ({ page }) => {
    const myUserAccessPage = new MyUserAccessPage(page);
    await myUserAccessPage.goto();
    await expect(myUserAccessPage.heading).toBeVisible({ timeout: E2E_TIMEOUTS.SETUP_PAGE_LOAD });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tab Navigation
// ═══════════════════════════════════════════════════════════════════════════

test.describe('My Access - Tab Navigation', () => {
  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Can switch between Groups and Workspaces tabs [OrgAdmin]', async ({ page }) => {
      const myUserAccessPage = new MyUserAccessPage(page);
      await myUserAccessPage.goto();
      await myUserAccessPage.verifyPageLoaded();

      // Default should be Groups tab
      const groupsTab = page.getByRole('tab', { name: /groups/i });
      await expect(groupsTab).toHaveAttribute('aria-selected', 'true');

      // Click Workspaces tab
      const workspacesTab = page.getByRole('tab', { name: /workspaces/i });
      await workspacesTab.click();
      await expect(workspacesTab).toHaveAttribute('aria-selected', 'true');
      await expect(page).toHaveURL(/my-user-access\/workspaces/);

      // Switch back to Groups
      await groupsTab.click();
      await expect(groupsTab).toHaveAttribute('aria-selected', 'true');
    });

    test('Groups tab shows table with data [OrgAdmin]', async ({ page }) => {
      const myUserAccessPage = new MyUserAccessPage(page);
      await myUserAccessPage.goto();
      await myUserAccessPage.verifyPageLoaded();

      // Verify table is visible
      await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    });

    test('Workspaces tab shows table with data [OrgAdmin]', async ({ page }) => {
      const myUserAccessPage = new MyUserAccessPage(page);
      await myUserAccessPage.goto();

      // Navigate to workspaces tab
      await page.getByRole('tab', { name: /workspaces/i }).click();

      // Verify table loads
      await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    });
  });
});
