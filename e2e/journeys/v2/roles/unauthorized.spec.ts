/**
 * V2 Roles - Unauthorized Access Tests
 *
 * Tests for users who should NOT have access to the Roles page.
 *
 * Personas: UserViewer, ReadOnlyUser
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_READONLY, AUTH_V2_USERVIEWER, setupPage } from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const ROLES_URL = '/iam/access-management/roles';

// ═══════════════════════════════════════════════════════════════════════════
// UserViewer - No Access (can only see Users)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('UserViewer', () => {
  test.use({ storageState: AUTH_V2_USERVIEWER });

  test(`Roles page shows unauthorized access [UserViewer]`, async ({ page }) => {
    await setupPage(page);
    await page.goto(ROLES_URL);

    await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ReadOnlyUser - Blocked Access
// ═══════════════════════════════════════════════════════════════════════════

test.describe('ReadOnlyUser', () => {
  test.use({ storageState: AUTH_V2_READONLY });

  test(`Roles page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
    await setupPage(page);
    await page.goto(ROLES_URL);

    await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
  });
});
