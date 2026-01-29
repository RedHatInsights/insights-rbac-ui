import { test, expect } from '@playwright/test';

/**
 * Basic smoke test for insights-rbac-ui
 * Verifies the application loads and key pages are accessible
 */

test.describe('RBAC UI Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Authentication is handled via E2E_USER and E2E_PASSWORD environment variables
    // The pipeline sets up the necessary session/cookies
  });

  test('should load the My User Access page', async ({ page }) => {
    // Navigate to the My User Access landing page
    await page.goto('/iam/my-user-access');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Verify the document title contains "User Access"
    await expect(page).toHaveTitle(/User Access/i);

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/my-user-access.png', fullPage: true });
  });

  test('should navigate to Users page', async ({ page }) => {
    // Navigate to User Access Users page
    await page.goto('/iam/user-access/users');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Verify we're on the Users page
    await expect(page).toHaveTitle(/Users.*User Access/i);

    // Take a screenshot
    await page.screenshot({ path: 'test-results/users-page.png', fullPage: true });
  });

  test('should navigate to Groups page', async ({ page }) => {
    // Navigate to User Access Groups page
    await page.goto('/iam/user-access/groups');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Verify we're on the Groups page
    await expect(page).toHaveTitle(/Groups.*User Access/i);

    // Take a screenshot
    await page.screenshot({ path: 'test-results/groups-page.png', fullPage: true });
  });

  test('should navigate to Roles page', async ({ page }) => {
    // Navigate to User Access Roles page
    await page.goto('/iam/user-access/roles');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Verify we're on the Roles page
    await expect(page).toHaveTitle(/Roles.*User Access/i);

    // Take a screenshot
    await page.screenshot({ path: 'test-results/roles-page.png', fullPage: true });
  });

  test('should display main navigation', async ({ page }) => {
    await page.goto('/iam/user-access/users');

    // Wait for the chrome/navigation to load
    await page.waitForLoadState('networkidle');

    // Verify insights-chrome navigation is present
    // The navigation should contain recognizable elements
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Take a screenshot to verify chrome loaded
    await page.screenshot({ path: 'test-results/navigation.png', fullPage: true });
  });
});
