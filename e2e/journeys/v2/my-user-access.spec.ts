/**
 * V2 My User Access - View Tests
 *
 * Tests for the My User Access page.
 * All personas can access this page.
 *
 * Includes regression tests for:
 * - Bundle switching (no freeze; uses replace, not full navigation)
 * - Round-trip navigation from My User Access to Users/Roles and back (no freeze)
 *
 * Personas: Admin, UserViewer, ReadOnlyUser
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER } from '../../utils';
import { MyUserAccessPage } from '../../pages/v2/MyUserAccessPage';
import { UsersPage } from '../../pages/v2/UsersPage';

// ═══════════════════════════════════════════════════════════════════════════
// Personas - All can access
// ═══════════════════════════════════════════════════════════════════════════

const allPersonas = [
  { name: 'Admin', auth: AUTH_V2_ADMIN },
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

// ═══════════════════════════════════════════════════════════════════════════
// Regression: bundle switch and round-trip navigation (must not freeze)
// Admin only: needs access to Users page for round-trip
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Regression - No freeze on bundle switch or round-trip nav', () => {
  test.use({ storageState: AUTH_V2_ADMIN });

  test('Bundle switch (RHEL → OpenShift) keeps page responsive', async ({ page }) => {
    const myUserAccessPage = new MyUserAccessPage(page);
    await myUserAccessPage.goto();
    await myUserAccessPage.verifyPageLoaded();
    await myUserAccessPage.switchBundle('OpenShift');
    await myUserAccessPage.verifyPageLoaded();
    await expect(page).toHaveURL(/bundle=openshift/);
  });

  test('Round-trip My User Access → Users → My User Access does not freeze', async ({ page }) => {
    const myUserAccessPage = new MyUserAccessPage(page);
    const usersPage = new UsersPage(page);
    await myUserAccessPage.goto();
    await myUserAccessPage.verifyPageLoaded();
    await usersPage.goto();
    await myUserAccessPage.goto();
    await myUserAccessPage.verifyPageLoaded();
  });
});
