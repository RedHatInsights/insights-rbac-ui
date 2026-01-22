/**
 * Production V2: Org User E2E Tests
 * 
 * Converted from: src/user-journeys/production-v2/ProductionV2OrgUser.stories.tsx
 * 
 * Tests the Management Fabric experience with regular user (non-admin) privileges
 * and V2 features enabled. Verifies read-only access restrictions.
 */

import { test, expect } from '@playwright/test';
import { navigateToPage, AUTH_USER } from '../../utils';

// Use regular user storage state for all tests in this file
test.use({ storageState: AUTH_USER });

test.describe('V2 Org User (Read Only)', () => {
  /**
   * Manual Testing Entry Point
   * Verifies My User Access page loads for regular users
   */
  test('My User Access page loads correctly', async ({ page }) => {
    await page.goto('/iam/my-user-access');
    await page.waitForLoadState('networkidle');

    // Verify My User Access page loads
    await expect(page.getByText(/my user access/i)).toBeVisible();
  });

  /**
   * View Users and User Groups (Read Only)
   * Tests that regular users can view the V2 Users and User Groups page in read-only mode
   */
  test('View Users and User Groups (Read Only)', async ({ page }) => {
    await page.goto('/iam/access-management/users-and-user-groups');
    await page.waitForLoadState('networkidle');

    // Verify the page loads
    await expect(page.getByText('Users and User Groups')).toBeVisible();

    // Verify tabs are present
    await expect(page.getByRole('tab', { name: /users/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /user groups/i })).toBeVisible();

    // Regular users should NOT see "Invite users" button
    await expect(page.getByRole('button', { name: /invite users/i })).not.toBeVisible();

    // Switch to User Groups tab
    const groupsTab = page.getByRole('tab', { name: /user groups/i });
    await groupsTab.click();

    // Regular users should NOT see "Create group" button
    await expect(page.getByRole('button', { name: /create group/i })).not.toBeVisible();
  });

  /**
   * View Workspaces (Read Only)
   * Tests that regular users can view workspaces but cannot create, edit, or delete them
   */
  test('View Workspaces (Read Only)', async ({ page }) => {
    await page.goto('/iam/access-management/workspaces');
    await page.waitForLoadState('networkidle');

    // Verify workspaces are visible
    await expect(page.getByText('Default Workspace')).toBeVisible();

    // Regular users should NOT see "Create workspace" button (or it should be disabled/hidden)
    const createButton = page.getByRole('button', { name: /create workspace/i });
    // Either the button is not visible, or if visible, it should be disabled
    const isVisible = await createButton.isVisible().catch(() => false);
    if (isVisible) {
      await expect(createButton).toBeDisabled();
    }
  });

  /**
   * Navigate V2 Sidebar (Limited Access)
   * Tests that regular users can navigate the V2 sidebar but with appropriate restrictions
   */
  test('Navigate V2 Sidebar (Limited Access)', async ({ page }) => {
    await page.goto('/iam/my-user-access');
    await page.waitForLoadState('networkidle');

    // Navigate to Overview (should work)
    await navigateToPage(page, 'Overview');

    // Navigate to Users and User Groups (should work, read-only)
    await navigateToPage(page, 'Users and User Groups');
    await expect(page.getByText('Users and User Groups')).toBeVisible();

    // Navigate to Workspaces (should work, read-only)
    await navigateToPage(page, 'Workspaces');

    // Verify no admin actions are available
    const createButton = page.getByRole('button', { name: /create workspace/i });
    const isVisible = await createButton.isVisible().catch(() => false);
    if (isVisible) {
      await expect(createButton).toBeDisabled();
    }
  });
});
