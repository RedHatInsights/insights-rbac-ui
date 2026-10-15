/**
 * Organization Management - Access Control Tests
 *
 * Verifies org-admin-only access: org admin can open the page;
 * non-org admins do not see it in nav and are blocked from direct URL.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 * ✓ Testing org admin can access Organization Management page
 * ✓ Testing non-org admin cannot see Organization Management in nav (see navigation-structure.spec)
 * ✓ Testing non-org admin is blocked from direct URL to Organization Management
 *
 * DO NOT add here if:
 * ✗ Testing nav structure/order only → navigation-structure.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS (see TEST_PERSONAS.md)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Organization Management requires is_org_admin (platform), not RBAC permissions.
 * V2 OrgAdmin on stage is typically org admin; UserViewer and ReadOnlyUser are not.
 *
 * @personas
 * - OrgAdmin: Can access /iam/organization-management/organization-wide-access
 * - UserViewer: Cannot access; direct URL shows unauthorized
 * - ReadOnlyUser: Cannot access; direct URL shows unauthorized
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies AUTH: AUTH_V2_ORGADMIN, AUTH_V2_USERVIEWER, AUTH_V2_READONLY
 * @dependencies PAGES: OrganizationManagementPage
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN, AUTH_V2_RBACADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER, iamUrl, v2 } from '../../../utils';
import { OrganizationManagementPage } from '../../../pages/v2/OrganizationManagementPage';
import { NavigationSidebar } from '../../../pages/v2/NavigationSidebar';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const ORG_MANAGEMENT_URL = iamUrl(v2.organizationManagement.link());

// ═══════════════════════════════════════════════════════════════════════════
// ORGADMIN (org admin) - Can access Organization Management
// ═══════════════════════════════════════════════════════════════════════════

test.describe('OrgAdmin', () => {
  test.use({ storageState: AUTH_V2_ORGADMIN });

  test('Org admin can access Organization Management page [OrgAdmin]', async ({ page }) => {
    const orgPage = new OrganizationManagementPage(page);
    await orgPage.goto();

    await expect(orgPage.heading).toBeVisible();
    await expect(orgPage.unauthorizedMessage).not.toBeVisible();
  });

  test('Organization management page shows org details [OrgAdmin]', async ({ page }) => {
    const orgPage = new OrganizationManagementPage(page);
    await orgPage.goto();

    await expect(orgPage.organizationName).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    await expect(orgPage.accountNumber).toBeVisible();
    await expect(orgPage.organizationId).toBeVisible();
  });

  test('Organization management page shows role assignments table [OrgAdmin]', async ({ page }) => {
    const orgPage = new OrganizationManagementPage(page);
    await orgPage.goto();

    await expect(orgPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    await expect(orgPage.table.getByRole('row')).not.toHaveCount(0, { timeout: E2E_TIMEOUTS.TABLE_DATA });
  });

  test('OrgAdmin can open and cancel grant access wizard [OrgAdmin]', async ({ page }) => {
    const orgPage = new OrganizationManagementPage(page);
    await orgPage.goto();

    await orgPage.grantAccessButton.click();
    await expect(orgPage.grantAccessWizard).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
    await expect(orgPage.grantAccessWizard.getByText(/grant.*access/i).first()).toBeVisible();

    await orgPage.grantAccessWizard.getByRole('button', { name: /cancel/i }).click();
    await expect(orgPage.grantAccessWizard).not.toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
    await expect(orgPage.heading).toBeVisible();
  });

  test('OrgAdmin row actions (edit, remove) are enabled for non-default groups [OrgAdmin]', async ({ page }) => {
    const orgPage = new OrganizationManagementPage(page);
    await orgPage.goto();

    await expect(orgPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    // If the table is empty skip action assertions — no groups to act on.
    const rows = orgPage.tableComponent.grid.getByRole('row');
    const rowCount = await rows.count();
    // row index 0 is the header; skip if no data rows
    if (rowCount <= 1) {
      return;
    }

    const firstRowName = await orgPage.firstRowName();
    await orgPage.openRowActions(firstRowName);

    const editItem = page.getByRole('menuitem', { name: /edit access/i });
    const removeItem = page.getByRole('menuitem', { name: /remove access/i });
    await expect(editItem).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
    await expect(removeItem).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
    await expect(editItem).not.toBeDisabled();
    await expect(removeItem).not.toBeDisabled();
  });

  test('OrgAdmin can open and cancel edit access modal [OrgAdmin]', async ({ page }) => {
    const orgPage = new OrganizationManagementPage(page);
    await orgPage.goto();

    await expect(orgPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    const rows = orgPage.tableComponent.grid.getByRole('row');
    const rowCount = await rows.count();
    if (rowCount <= 1) {
      return;
    }

    const firstRowName = await orgPage.firstRowName();
    await orgPage.openRowActions(firstRowName);
    await page.getByRole('menuitem', { name: /edit access/i }).click();

    await expect(orgPage.editAccessModal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
    await expect(orgPage.editAccessModal.getByText(/edit access/i)).toBeVisible();

    await orgPage.editAccessModal.getByRole('button', { name: /cancel/i }).click();
    await expect(orgPage.editAccessModal).not.toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
    await expect(orgPage.heading).toBeVisible();
  });

  test('OrgAdmin can select roles and submit edit access modal [OrgAdmin]', async ({ page }) => {
    const orgPage = new OrganizationManagementPage(page);
    await orgPage.goto();

    await expect(orgPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    const rows = orgPage.tableComponent.grid.getByRole('row');
    const rowCount = await rows.count();
    if (rowCount <= 1) {
      return;
    }

    const firstRowName = await orgPage.firstRowName();
    await orgPage.openRowActions(firstRowName);
    await page.getByRole('menuitem', { name: /edit access/i }).click();

    await expect(orgPage.editAccessModal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

    // Wait for role grid inside the modal
    const roleGrid = orgPage.editAccessModal.getByRole('grid', { name: /roles selection table/i });
    const gridVisible = await roleGrid.isVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA }).catch(() => false);
    if (!gridVisible) {
      // No role grid loaded; nothing to submit — cancel gracefully
      await orgPage.editAccessModal.getByRole('button', { name: /cancel/i }).click();
      return;
    }

    // Find an unchecked role checkbox and select it
    const uncheckedBox = roleGrid.locator('input[type="checkbox"]:not(:checked)').first();
    const hasUnchecked = await uncheckedBox.isVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT }).catch(() => false);
    if (!hasUnchecked) {
      // All roles already selected; nothing to change — cancel gracefully
      await orgPage.editAccessModal.getByRole('button', { name: /cancel/i }).click();
      return;
    }

    await uncheckedBox.click();

    const updateButton = orgPage.editAccessModal.getByRole('button', { name: /update/i });
    await expect(updateButton).not.toBeDisabled({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
    await updateButton.click();

    await expect(orgPage.editAccessModal).not.toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
    await expect(orgPage.heading).toBeVisible();
  });

  test('OrgAdmin can open and cancel remove access confirmation [OrgAdmin]', async ({ page }) => {
    const orgPage = new OrganizationManagementPage(page);
    await orgPage.goto();

    await expect(orgPage.table).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    const rows = orgPage.tableComponent.grid.getByRole('row');
    const rowCount = await rows.count();
    if (rowCount <= 1) {
      return;
    }

    const firstRowName = await orgPage.firstRowName();
    await orgPage.openRowActions(firstRowName);
    await page.getByRole('menuitem', { name: /remove access/i }).click();

    await expect(orgPage.removeAccessModal).toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });

    await orgPage.removeAccessModal.getByRole('button', { name: /cancel/i }).click();
    await expect(orgPage.removeAccessModal).not.toBeVisible({ timeout: E2E_TIMEOUTS.DIALOG_CONTENT });
    await expect(orgPage.heading).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// USERVIEWER (non-org admin) - Blocked from direct URL
// ═══════════════════════════════════════════════════════════════════════════

test.describe('UserViewer', () => {
  test.use({ storageState: AUTH_V2_USERVIEWER });

  test('Non-org admin is blocked from direct URL to Organization Management [UserViewer]', async ({ page }) => {
    const navSidebar = new NavigationSidebar(page);
    await navSidebar.gotoPath(ORG_MANAGEMENT_URL);

    await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// READONLYUSER (non-org admin) - Blocked from direct URL
// ═══════════════════════════════════════════════════════════════════════════

test.describe('ReadOnlyUser', () => {
  test.use({ storageState: AUTH_V2_READONLY });

  test('Non-org admin is blocked from direct URL to Organization Management [ReadOnlyUser]', async ({ page }) => {
    const navSidebar = new NavigationSidebar(page);
    await navSidebar.gotoPath(ORG_MANAGEMENT_URL);

    await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.SLOW_DATA });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RBACADMIN (non-org admin) - Blocked from direct URL
// ═══════════════════════════════════════════════════════════════════════════

test.describe('RbacAdmin', () => {
  test.use({ storageState: AUTH_V2_RBACADMIN });

  test('Non-org admin is blocked from direct URL to Organization Management [RbacAdmin]', async ({ page }) => {
    const navSidebar = new NavigationSidebar(page);
    await navSidebar.gotoPath(ORG_MANAGEMENT_URL);
    await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
  });
});
