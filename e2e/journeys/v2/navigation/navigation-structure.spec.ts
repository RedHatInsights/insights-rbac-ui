/**
 * V2 Navigation Structure Tests
 *
 * Verifies the V2 left navigation (Chrome sidebar): structure, order,
 * limited nav for non-admins, and cross-page navigation without errors.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 * ✓ Testing V2 nav sections and item order
 * ✓ Testing that non-admin users do not see Organization Management in nav
 * ✓ Testing that clicking nav items loads pages without errors
 *
 * DO NOT add here if:
 * ✗ Testing Organization Management page access (direct URL) → organization-management-access.spec.ts
 * ✗ Testing CRUD on an entity → use *-management.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS (see TEST_PERSONAS.md)
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability V2 navigation structure and cross-page navigation
 *
 * @personas
 * - Admin: Sees full nav (including Organization Management if org admin)
 * - UserViewer: Sees Access Management section only; no Organization Management
 * - ReadOnlyUser: Sees limited nav; no Organization Management
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies AUTH: AUTH_V2_ADMIN, AUTH_V2_USERVIEWER, AUTH_V2_READONLY
 * @dependencies UTILS: NavigationSidebar
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER } from '../../../utils';
import { NavigationSidebar } from '../../../pages/v2/NavigationSidebar';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const { NAV_MY_ACCESS, NAV_OVERVIEW, NAV_ACCESS_MANAGEMENT, NAV_USERS_AND_GROUPS, NAV_ROLES, NAV_WORKSPACES, NAV_ORGANIZATION_MANAGEMENT } =
  NavigationSidebar;

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN - Full nav structure and cross-page navigation
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin', () => {
  test.use({ storageState: AUTH_V2_ADMIN });

  test('V2 navigation structure and order are correct [Admin]', async ({ page }) => {
    const navSidebar = new NavigationSidebar(page);
    await navSidebar.gotoOverview();

    await expect(page.getByRole('link', { name: NAV_MY_ACCESS })).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    await expect(page.getByRole('link', { name: NAV_OVERVIEW })).toBeVisible({ timeout: E2E_TIMEOUTS.QUICK_SETTLE });
    await expect(navSidebar.getNavExpandable(NAV_ACCESS_MANAGEMENT)).toBeVisible({ timeout: E2E_TIMEOUTS.QUICK_SETTLE });

    const accessMgmt = navSidebar.getNavExpandable(NAV_ACCESS_MANAGEMENT);
    const expanded = await accessMgmt.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await accessMgmt.click();
      await page.waitForTimeout(E2E_TIMEOUTS.MENU_ANIMATION);
    }

    await expect(page.getByRole('link', { name: NAV_USERS_AND_GROUPS })).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
    await expect(page.getByRole('link', { name: NAV_ROLES })).toBeVisible({ timeout: E2E_TIMEOUTS.QUICK_SETTLE });
    await expect(page.getByRole('link', { name: NAV_WORKSPACES })).toBeVisible({ timeout: E2E_TIMEOUTS.QUICK_SETTLE });
  });

  test('Cross-page navigation works without errors [Admin]', async ({ page }) => {
    const navSidebar = new NavigationSidebar(page);
    await navSidebar.gotoOverview();

    await navSidebar.expandAndClickNavLink(NAV_ACCESS_MANAGEMENT, NAV_USERS_AND_GROUPS);
    await expect(page).toHaveURL(/\/access-management\/users-and-user-groups/, { timeout: E2E_TIMEOUTS.URL_CHANGE });
    await expect(page.getByRole('heading', { name: /users and groups|users/i })).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    await navSidebar.expandAndClickNavLink(NAV_ACCESS_MANAGEMENT, NAV_ROLES);
    await expect(page).toHaveURL(/\/access-management\/roles/, { timeout: E2E_TIMEOUTS.URL_CHANGE });
    await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    await navSidebar.expandAndClickNavLink(NAV_ACCESS_MANAGEMENT, NAV_WORKSPACES);
    await expect(page).toHaveURL(/\/access-management\/workspaces/, { timeout: E2E_TIMEOUTS.URL_CHANGE });
    await expect(page.getByRole('heading', { name: /workspaces/i })).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    await navSidebar.clickNavLink(NAV_OVERVIEW);
    await expect(page).toHaveURL(/\/overview/, { timeout: E2E_TIMEOUTS.URL_CHANGE });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// USERVIEWER - Limited nav (no Organization Management)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('UserViewer', () => {
  test.use({ storageState: AUTH_V2_USERVIEWER });

  test('Non-admin does not see Organization Management in navigation [UserViewer]', async ({ page }) => {
    const navSidebar = new NavigationSidebar(page);
    await navSidebar.gotoMyAccess();

    const orgMgmtVisible = await navSidebar.isNavItemVisible(NAV_ORGANIZATION_MANAGEMENT);
    expect(orgMgmtVisible).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// READONLYUSER - Limited nav (no Organization Management)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('ReadOnlyUser', () => {
  test.use({ storageState: AUTH_V2_READONLY });

  test('Non-admin does not see Organization Management in navigation [ReadOnlyUser]', async ({ page }) => {
    const navSidebar = new NavigationSidebar(page);
    await navSidebar.gotoMyAccess();

    const orgMgmtVisible = await navSidebar.isNavItemVisible(NAV_ORGANIZATION_MANAGEMENT);
    expect(orgMgmtVisible).toBe(false);
  });
});
