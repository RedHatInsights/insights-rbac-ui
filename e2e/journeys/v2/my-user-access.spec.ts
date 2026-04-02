/**
 * V2 My User Access - View Tests
 *
 * Tests for the My User Access page.
 * All personas can access this page.
 *
 * Personas: Admin, UserViewer, ReadOnlyUser
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER, AUTH_V2_WORKSPACEUSER, iamUrl, v2 } from '../../utils';
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
      await expect(page).toHaveURL(iamUrl(v2.myAccessWorkspaces.link()));

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

// ═══════════════════════════════════════════════════════════════════════════
// Workspaces Tab — Interaction Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('My Access — Workspaces tab', () => {
  test.describe('OrgAdmin', () => {
    test.use({ storageState: AUTH_V2_ORGADMIN });

    test('Workspace rows show Admin or Viewer label [OrgAdmin]', async ({ page }) => {
      const myUserAccessPage = new MyUserAccessPage(page);
      await myUserAccessPage.goto();

      await page.getByRole('tab', { name: /workspaces/i }).click();
      await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      const roleLabel = page.getByRole('grid').getByText('Admin').or(page.getByRole('grid').getByText('Viewer')).first();
      await expect(roleLabel).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    });

    test('Workspace link navigates to workspace detail [OrgAdmin]', async ({ page }) => {
      const myUserAccessPage = new MyUserAccessPage(page);
      await myUserAccessPage.goto();

      await page.getByRole('tab', { name: /workspaces/i }).click();
      await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      const firstLink = page.getByRole('grid').getByRole('link').first();
      await expect(firstLink).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      const workspaceName = (await firstLink.textContent()) ?? '';

      await firstLink.click();
      await expect(page).toHaveURL(/\/workspaces\//, { timeout: E2E_TIMEOUTS.URL_CHANGE });
      await expect(page.getByRole('heading', { name: workspaceName })).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });

    test('Workspace row click opens detail drawer [OrgAdmin]', async ({ page }) => {
      const myUserAccessPage = new MyUserAccessPage(page);
      await myUserAccessPage.goto();

      await page.getByRole('tab', { name: /workspaces/i }).click();
      await expect(page.getByRole('grid')).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

      // Click the "Admin or Viewer role" cell (not the workspace name link) to open the drawer
      // without navigating away. The workspace name is a link with stopPropagation;
      // clicking the role cell triggers the row click handler.
      // Use the <td data-label> to click the cell itself, not the inner label span.
      const roleCell = page.getByRole('grid').locator('[data-label="Admin or Viewer role"]').first();
      await expect(roleCell).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
      await roleCell.click();

      await expect(page.getByTestId('detail-drawer-panel')).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    });
  });
});
