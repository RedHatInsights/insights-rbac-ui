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
