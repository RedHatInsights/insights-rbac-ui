/**
 * Navigation helpers for Playwright E2E tests
 * Ported from src/user-journeys/_shared/helpers/navigationHelpers.ts
 */

import { Page, expect } from '@playwright/test';

/**
 * Navigates to a page by clicking the sidebar navigation link
 */
export async function navigateToPage(page: Page, linkText: string) {
  await page.getByRole('link', { name: linkText }).click();
  await page.waitForLoadState('networkidle');
}

/**
 * Waits for a page/list to load by checking for a specific element
 */
export async function waitForPageToLoad(page: Page, elementText: string, timeout = 10000) {
  await expect(page.getByText(elementText)).toBeVisible({ timeout });
}

/**
 * Navigates to a URL and waits for the page to load
 */
export async function goToPage(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}
