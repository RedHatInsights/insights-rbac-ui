/**
 * V1 Users - Unauthorized Access Tests
 *
 * Tests for users who should NOT have access to the Users page.
 *
 * Personas: ReadOnlyUser
 */

import { expect, test } from '@playwright/test';
import { AUTH_V1_READONLY, setupPage } from '../../../utils';

const USERS_URL = '/iam/user-access/users';

// ═══════════════════════════════════════════════════════════════════════════
// ReadOnlyUser - Blocked Access
// ═══════════════════════════════════════════════════════════════════════════

test.describe('ReadOnlyUser', () => {
  test.use({ storageState: AUTH_V1_READONLY });

  test(`Users page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
    await setupPage(page);
    await page.goto(USERS_URL);

    await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: 15000 });
  });
});
