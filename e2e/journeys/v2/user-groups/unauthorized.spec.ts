/**
 * V2 User Groups - Unauthorized Access Tests
 *
 * Tests for users who should NOT have access to the User Groups page.
 *
 * Personas: ReadOnlyUser
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_READONLY, setupPage } from '../../../utils';
import { E2E_TIMEOUTS } from '../../../utils/timeouts';

const GROUPS_URL = '/iam/access-management/users-and-user-groups/user-groups';

// ═══════════════════════════════════════════════════════════════════════════
// ReadOnlyUser - Blocked Access
// ═══════════════════════════════════════════════════════════════════════════

test.describe('ReadOnlyUser', () => {
  test.use({ storageState: AUTH_V2_READONLY });

  test(`User Groups page shows unauthorized access [ReadOnlyUser]`, async ({ page }) => {
    await setupPage(page);
    await page.goto(GROUPS_URL);

    await expect(page.getByText(/You do not have access to/i)).toBeVisible({ timeout: E2E_TIMEOUTS.DETAIL_CONTENT });
  });
});
