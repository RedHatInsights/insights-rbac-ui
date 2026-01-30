/**
 * V1 My User Access - View Tests
 *
 * Tests for the My User Access page.
 * All personas can access this page.
 *
 * Personas: Admin, UserViewer, ReadOnlyUser
 */

import { test } from '@playwright/test';
import { AUTH_V1_ADMIN, AUTH_V1_READONLY, AUTH_V1_USERVIEWER } from '../../utils';
import { MyUserAccessPage } from '../../pages/v1/MyUserAccessPage';

// ═══════════════════════════════════════════════════════════════════════════
// Personas - All can access
// ═══════════════════════════════════════════════════════════════════════════

const allPersonas = [
  { name: 'Admin', auth: AUTH_V1_ADMIN },
  { name: 'UserViewer', auth: AUTH_V1_USERVIEWER },
  { name: 'ReadOnlyUser', auth: AUTH_V1_READONLY },
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
