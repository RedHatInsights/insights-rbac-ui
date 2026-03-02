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
 * V2 Admin on stage is typically org admin; UserViewer and ReadOnlyUser are not.
 *
 * @personas
 * - Admin (org admin): Can access /iam/organization-management/organization-wide-access
 * - UserViewer: Cannot access; direct URL shows unauthorized
 * - ReadOnlyUser: Cannot access; direct URL shows unauthorized
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies AUTH: AUTH_V2_ADMIN, AUTH_V2_USERVIEWER, AUTH_V2_READONLY
 * @dependencies UTILS: NavigationSidebar (for direct URL goto)
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER } from '../../../utils';
import { NavigationSidebar } from '../../../pages/v2/NavigationSidebar';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const ORG_MANAGEMENT_URL = '/iam/organization-management/organization-wide-access';

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN (org admin) - Can access Organization Management
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Admin', () => {
  test.use({ storageState: AUTH_V2_ADMIN });

  test('Org admin can access Organization Management page [Admin]', async ({ page }) => {
    const navSidebar = new NavigationSidebar(page);
    await navSidebar.gotoPath(ORG_MANAGEMENT_URL);

    await expect(page).toHaveURL(/\/organization-management\/organization-wide-access/, { timeout: E2E_TIMEOUTS.URL_CHANGE });
    await expect(page.getByRole('heading', { name: /Organization-Wide Access/i })).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
    await expect(page.getByText(/You do not have access to/i)).not.toBeVisible();
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

    await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
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

    await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
  });
});
