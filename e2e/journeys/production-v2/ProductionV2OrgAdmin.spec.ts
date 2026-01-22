/**
 * Production V2: Org Admin E2E Tests
 * 
 * Converted from: src/user-journeys/production-v2/ProductionV2OrgAdmin.stories.tsx
 * 
 * Tests the Management Fabric experience with Org Admin privileges
 * and all V2 features enabled.
 */

import { test, expect } from '@playwright/test';
import { navigateToPage, waitForPageToLoad, AUTH_ADMIN } from '../../utils';

// Use admin storage state for all tests in this file
test.use({ storageState: AUTH_ADMIN });

test.describe('V2 Org Admin', () => {
  /**
   * Manual Testing Entry Point
   * Verifies the V2 Users and User Groups page loads with proper tabs
   */
  test('Users and User Groups page loads correctly', async ({ page }) => {
    await page.goto('/iam/access-management/users-and-user-groups');
    await page.waitForLoadState('networkidle');

    // Verify the page title
    await expect(page.getByText('Users and User Groups')).toBeVisible();

    // Verify tabs are present
    await expect(page.getByRole('tab', { name: /users/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /user groups/i })).toBeVisible();
  });

  /**
   * Navigate V2 Sidebar
   * Tests navigation through all V2 Access Management sidebar items
   */
  test('Navigate V2 Sidebar', async ({ page }) => {
    await page.goto('/iam/access-management/overview');
    await page.waitForLoadState('networkidle');

    // Navigate to Users and User Groups
    await navigateToPage(page, 'Users and User Groups');
    await expect(page.getByText('Users and User Groups')).toBeVisible();

    // Navigate to Workspaces
    await navigateToPage(page, 'Workspaces');
    await expect(page.getByText('Default Workspace')).toBeVisible();

    // Navigate back to Overview
    await navigateToPage(page, 'Overview');
  });

  /**
   * Users and User Groups Flow
   * Tests the new Users and User Groups page functionality
   */
  test('Users and User Groups Flow', async ({ page }) => {
    await page.goto('/iam/access-management/users-and-user-groups/users');
    await page.waitForLoadState('networkidle');

    // Verify Users tab is active
    const usersTab = page.getByRole('tab', { name: /users/i });
    await expect(usersTab).toHaveAttribute('aria-selected', 'true');

    // Switch to User Groups tab
    const groupsTab = page.getByRole('tab', { name: /user groups/i });
    await groupsTab.click();

    // Verify User Groups tab is now active
    await expect(groupsTab).toHaveAttribute('aria-selected', 'true');

    // Switch back to Users
    await usersTab.click();
    await expect(usersTab).toHaveAttribute('aria-selected', 'true');
  });

  /**
   * Workspaces Full Features
   * Tests workspace management with all M5 features enabled
   */
  test('Workspaces Full Features', async ({ page }) => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    // Wait for workspaces to load
    await waitForPageToLoad(page, 'Default Workspace');

    // Verify create button is enabled (M5 features)
    const createButton = page.getByRole('button', { name: /create workspace/i });
    await expect(createButton).toBeEnabled();
  });
});
