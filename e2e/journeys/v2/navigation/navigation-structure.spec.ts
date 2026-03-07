/**
 * V2 Navigation Structure Tests
 *
 * Verifies the V2 left navigation (Chrome sidebar): structure, order,
 * correct hrefs (from frontend.yaml), and limited nav for non-admins.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 * ✓ Testing V2 nav sections and item order
 * ✓ Testing that non-admin users do not see Organization Management in nav
 * ✓ Testing that nav item hrefs match expected routes from frontend.yaml
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
 * @dependencies AUTH: AUTH_V2_ORGADMIN, AUTH_V2_USERVIEWER, AUTH_V2_READONLY
 * @dependencies UTILS: NavigationSidebar
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ORGADMIN, AUTH_V2_RBACADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER, AUTH_V2_WORKSPACEUSER, setupPage } from '../../../utils';
import { NavigationSidebar } from '../../../pages/v2/NavigationSidebar';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const {
  NAV_MY_ACCESS,
  NAV_OVERVIEW,
  NAV_ACCESS_MANAGEMENT,
  NAV_USERS_AND_GROUPS,
  NAV_ROLES,
  NAV_WORKSPACES,
  NAV_ORGANIZATION_MANAGEMENT,
  NAV_ORGANIZATION_WIDE_ACCESS,
} = NavigationSidebar;

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN - Full nav structure and cross-page navigation
// ═══════════════════════════════════════════════════════════════════════════

test.describe('OrgAdmin', () => {
  test.use({ storageState: AUTH_V2_ORGADMIN });

  test('V2 navigation structure and order are correct [OrgAdmin]', async ({ page }) => {
    const navSidebar = new NavigationSidebar(page);
    await navSidebar.gotoOverview();

    await expect(navSidebar.getNavLink(NAV_MY_ACCESS)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    await expect(navSidebar.getNavLink(NAV_OVERVIEW)).toBeVisible({ timeout: E2E_TIMEOUTS.QUICK_SETTLE });
    await expect(navSidebar.getNavExpandable(NAV_ACCESS_MANAGEMENT)).toBeVisible({ timeout: E2E_TIMEOUTS.QUICK_SETTLE });

    const accessMgmt = navSidebar.getNavExpandable(NAV_ACCESS_MANAGEMENT);
    const expanded = await accessMgmt.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await accessMgmt.click();
      await page.waitForTimeout(E2E_TIMEOUTS.MENU_ANIMATION);
    }

    await expect(navSidebar.getNavLink(NAV_USERS_AND_GROUPS)).toBeVisible({ timeout: E2E_TIMEOUTS.MENU_ANIMATION });
    await expect(navSidebar.getNavLink(NAV_ROLES)).toBeVisible({ timeout: E2E_TIMEOUTS.QUICK_SETTLE });
    await expect(navSidebar.getNavLink(NAV_WORKSPACES)).toBeVisible({ timeout: E2E_TIMEOUTS.QUICK_SETTLE });
  });

  test('Sidebar links have correct hrefs from frontend.yaml [OrgAdmin]', async ({ page }) => {
    const navSidebar = new NavigationSidebar(page);
    await navSidebar.gotoOverview();

    const accessMgmt = navSidebar.getNavExpandable(NAV_ACCESS_MANAGEMENT);
    const expanded = await accessMgmt.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await accessMgmt.click();
      await page.waitForTimeout(E2E_TIMEOUTS.MENU_ANIMATION);
    }

    await expect(navSidebar.getNavLink(NAV_OVERVIEW)).toHaveAttribute('href', /\/overview/);
    await expect(navSidebar.getNavLink(NAV_MY_ACCESS)).toHaveAttribute('href', /\/my-user-access/);
    await expect(navSidebar.getNavLink(NAV_USERS_AND_GROUPS)).toHaveAttribute('href', /\/access-management\/users-and-user-groups/);
    await expect(navSidebar.getNavLink(NAV_ROLES)).toHaveAttribute('href', /\/access-management\/roles/);
    await expect(navSidebar.getNavLink(NAV_WORKSPACES)).toHaveAttribute('href', /\/access-management\/workspaces/);

    const orgMgmt = navSidebar.getNavExpandable(NAV_ORGANIZATION_MANAGEMENT);
    const orgExpanded = await orgMgmt.getAttribute('aria-expanded');
    if (orgExpanded !== 'true') {
      await orgMgmt.click();
      await page.waitForTimeout(E2E_TIMEOUTS.MENU_ANIMATION);
    }

    await expect(navSidebar.getNavLink(NAV_ORGANIZATION_WIDE_ACCESS)).toHaveAttribute('href', /\/organization-management\/organization-wide-access/);
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

// ═══════════════════════════════════════════════════════════════════════════
// RBACADMIN - rbac:: write perms, not org admin; no Organization Management
// ═══════════════════════════════════════════════════════════════════════════

test.describe('RbacAdmin', () => {
  test.use({ storageState: AUTH_V2_RBACADMIN });

  test('Non-org admin does not see Organization Management in navigation [RbacAdmin]', async ({ page }) => {
    // Same assertion as UserViewer - RbacAdmin has RBAC perms but is not org admin
    await setupPage(page);
    const navSidebar = new NavigationSidebar(page);
    await navSidebar.gotoOverview();
    await expect(navSidebar.getNavLink(NAV_ORGANIZATION_MANAGEMENT)).not.toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// WORKSPACEUSER - Non-admin with explicit workspace access
// ═══════════════════════════════════════════════════════════════════════════

test.describe('WorkspaceUser', () => {
  test.use({ storageState: AUTH_V2_WORKSPACEUSER });

  test('Non-org admin does not see Organization Management in navigation [WorkspaceUser]', async ({ page }) => {
    await setupPage(page);
    const navSidebar = new NavigationSidebar(page);
    await navSidebar.gotoOverview();
    await expect(navSidebar.getNavLink(NAV_ORGANIZATION_MANAGEMENT)).not.toBeVisible();
  });
});
