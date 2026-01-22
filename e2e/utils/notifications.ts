/**
 * Notification helpers for Playwright E2E tests
 * Ported from src/user-journeys/_shared/helpers/navigationHelpers.ts
 */

import { Page, expect } from '@playwright/test';

/**
 * Verifies a success notification appears and no error/warning notifications
 */
export async function verifySuccessNotification(page: Page, timeout = 5000) {
  // Look for success notification - try both PF5 and PF6 class patterns
  const successNotification = page.locator(
    '.pf-v6-c-alert.pf-m-success, .pf-c-alert.pf-m-success, [class*="pf-m-success"]'
  );
  await expect(successNotification.first()).toBeVisible({ timeout });

  // Verify no error or warning notifications
  const errorNotification = page.locator('.pf-v6-c-alert.pf-m-danger, .pf-c-alert.pf-m-danger');
  await expect(errorNotification).not.toBeVisible();

  const warningNotification = page.locator('.pf-v6-c-alert.pf-m-warning, .pf-c-alert.pf-m-warning');
  await expect(warningNotification).not.toBeVisible();
}
