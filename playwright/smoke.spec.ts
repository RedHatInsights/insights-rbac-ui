import { test, expect } from '@playwright/test';

/**
 * Basic smoke test for insights-rbac-ui
 * Verifies the application loads and basic navigation works
 */

test.describe('RBAC UI Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up any necessary page configurations
    // The pipeline will handle authentication via cookies/session
  });

  test('should load the IAM landing page', async ({ page }) => {
    // Navigate to the IAM page
    await page.goto('/iam');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Verify the page title or header
    await expect(page).toHaveTitle(/Identity & Access Management|User Access|RBAC/i);

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/iam-landing-page.png', fullPage: true });
  });

  test('should navigate to My User Access page', async ({ page }) => {
    // Navigate to My User Access
    await page.goto('/iam/my-user-access');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Verify we're on the right page
    // This could check for specific headings or content
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should display main navigation', async ({ page }) => {
    await page.goto('/iam');

    // Wait for the chrome/navigation to load
    await page.waitForLoadState('networkidle');

    // Verify insights-chrome navigation is present
    // Note: This selector may need adjustment based on actual DOM structure
    const navigation = page.locator('[data-ouia-component-type="PF5/Nav"]').or(page.locator('nav'));
    await expect(navigation.first()).toBeVisible({ timeout: 10000 });
  });
});
