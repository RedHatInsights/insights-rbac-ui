/**
 * User Group Lifecycle E2E Test
 *
 * A serial test covering the complete lifecycle of a user group:
 * Create → Verify → Edit → Delete → Verify Cleanup
 *
 * SAFETY RAIL: This test creates transient data and REQUIRES the TEST_PREFIX
 * environment variable to be set. Without it, the test will fail immediately
 * to prevent polluting the environment with un-prefixed data.
 *
 * Usage:
 *   TEST_PREFIX=myprefix npx playwright test UserGroupLifecycle
 */

import { test, expect, Page } from '@playwright/test';
import { AUTH_ADMIN } from '../../utils';
import { seedMap } from '../../utils/seed-map';

// ============================================================================
// SAFETY RAIL: Require TEST_PREFIX environment variable
// ============================================================================
const TEST_PREFIX = process.env.TEST_PREFIX;

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX environment variable is REQUIRED          ║\n' +
      '║                                                                      ║\n' +
      '║  This test creates transient data that must be prefixed to avoid    ║\n' +
      '║  polluting the environment. Set TEST_PREFIX before running:         ║\n' +
      '║                                                                      ║\n' +
      '║    TEST_PREFIX=e2e npx playwright test UserGroupLifecycle           ║\n' +
      '║                                                                      ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n'
  );
}

// ============================================================================
// Test Configuration
// ============================================================================

// Use admin storage state
test.use({ storageState: AUTH_ADMIN });

// Configure serial execution - tests run in order and share state
test.describe.configure({ mode: 'serial' });

test.describe('User Group Lifecycle', () => {
  // Dynamic group name with prefix and timestamp
  const timestamp = Date.now();
  const groupName = `${TEST_PREFIX}__lifecycle-group-${timestamp}`;
  const editedGroupName = `${TEST_PREFIX}__lifecycle-group-${timestamp}-edited`;
  const groupDescription = 'E2E lifecycle test group - will be deleted';
  const editedDescription = 'E2E lifecycle test group (edited) - will be deleted';

  // Shared page instance for serial tests
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    // Double-check safety rail in beforeAll (belt and suspenders)
    if (!process.env.TEST_PREFIX) {
      throw new Error('TEST_PREFIX environment variable is required');
    }

    const context = await browser.newContext({ storageState: AUTH_ADMIN });
    page = await context.newPage();

    // Log the test configuration
    console.log(`\n[UserGroupLifecycle] Using prefix: ${TEST_PREFIX}`);
    console.log(`[UserGroupLifecycle] Group name: ${groupName}`);
    console.log(`[UserGroupLifecycle] Edited name: ${editedGroupName}\n`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ==========================================================================
  // Step 1: Create User Group
  // ==========================================================================
  test('Step 1: Create user group', async () => {
    // Navigate to User Groups page
    await page.goto('/iam/access-management/users-and-user-groups');
    await page.waitForLoadState('networkidle');

    // Click on User Groups tab
    const userGroupsTab = page.getByRole('tab', { name: /user groups/i });
    await userGroupsTab.click();
    await page.waitForLoadState('networkidle');

    // Verify we're on the User Groups tab
    await expect(userGroupsTab).toHaveAttribute('aria-selected', 'true');

    // Click "Create user group" button
    const createButton = page.getByRole('button', { name: /create user group/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for create form/modal
    await page.waitForLoadState('networkidle');

    // Fill in group name
    const nameInput = page.getByLabel(/user group name|name/i);
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(groupName);

    // Fill in description
    const descriptionInput = page.getByLabel(/description/i);
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(groupDescription);
    }

    // Submit form
    const submitButton = page.getByRole('button', { name: /submit|create|save/i });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for creation to complete
    await page.waitForLoadState('networkidle');

    // Verify we're back on the groups list
    await expect(page.getByRole('tab', { name: /user groups/i })).toBeVisible();

    // Verify the new group appears in the list
    await expect(page.getByText(groupName)).toBeVisible({ timeout: 10000 });

    console.log(`[Step 1] Created group: ${groupName}`);
  });

  // ==========================================================================
  // Step 2: Verify Group Details
  // ==========================================================================
  test('Step 2: Verify group in table and drawer', async () => {
    // Navigate to User Groups page
    await page.goto('/iam/access-management/users-and-user-groups');
    await page.waitForLoadState('networkidle');

    // Click on User Groups tab
    await page.getByRole('tab', { name: /user groups/i }).click();
    await page.waitForLoadState('networkidle');

    // Wait for table to load
    await expect(page.getByRole('grid')).toBeVisible();

    // Find our test group in the table
    const groupCell = page.getByText(groupName);
    await expect(groupCell).toBeVisible();

    // Click on the group to open the drawer
    await groupCell.click();

    // Verify drawer opens with group details
    const drawer = page.locator('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    await expect(drawer).toBeVisible({ timeout: 5000 });

    // Verify group name is shown in drawer
    await expect(drawer.getByText(groupName)).toBeVisible();

    // Close drawer
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible({ timeout: 3000 });

    console.log(`[Step 2] Verified group details: ${groupName}`);
  });

  // ==========================================================================
  // Step 3: Edit User Group
  // ==========================================================================
  test('Step 3: Edit user group', async () => {
    // Navigate to User Groups page
    await page.goto('/iam/access-management/users-and-user-groups');
    await page.waitForLoadState('networkidle');

    // Click on User Groups tab
    await page.getByRole('tab', { name: /user groups/i }).click();
    await page.waitForLoadState('networkidle');

    // Wait for table to load
    await expect(page.getByRole('grid')).toBeVisible();

    // Find the row containing our test group
    const groupRow = page.locator('tbody tr', { has: page.getByText(groupName) });
    await expect(groupRow).toBeVisible();

    // Click the kebab menu
    const kebabButton = groupRow.getByRole('button', { name: /actions|kebab/i });
    await kebabButton.click();

    // Click Edit option
    const editOption = page.getByRole('menuitem', { name: /edit/i });
    await expect(editOption).toBeVisible();
    await editOption.click();

    // Wait for edit form
    await page.waitForLoadState('networkidle');

    // Update name
    const nameInput = page.getByLabel(/user group name|name/i);
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.clear();
    await nameInput.fill(editedGroupName);

    // Update description if visible
    const descriptionInput = page.getByLabel(/description/i);
    if (await descriptionInput.isVisible()) {
      await descriptionInput.clear();
      await descriptionInput.fill(editedDescription);
    }

    // Save changes
    const saveButton = page.getByRole('button', { name: /save|submit|update/i });
    await saveButton.click();

    // Wait for update to complete
    await page.waitForLoadState('networkidle');

    // Verify the updated name appears in the list
    await expect(page.getByText(editedGroupName)).toBeVisible({ timeout: 10000 });

    // Verify old name is gone
    await expect(page.getByText(groupName)).not.toBeVisible();

    console.log(`[Step 3] Edited group: ${groupName} → ${editedGroupName}`);
  });

  // ==========================================================================
  // Step 4: Delete User Group
  // ==========================================================================
  test('Step 4: Delete user group', async () => {
    // Navigate to User Groups page
    await page.goto('/iam/access-management/users-and-user-groups');
    await page.waitForLoadState('networkidle');

    // Click on User Groups tab
    await page.getByRole('tab', { name: /user groups/i }).click();
    await page.waitForLoadState('networkidle');

    // Wait for table to load
    await expect(page.getByRole('grid')).toBeVisible();

    // Find the row containing our edited test group
    const groupRow = page.locator('tbody tr', { has: page.getByText(editedGroupName) });
    await expect(groupRow).toBeVisible();

    // Click the kebab menu
    const kebabButton = groupRow.getByRole('button', { name: /actions|kebab/i });
    await kebabButton.click();

    // Click Delete option
    const deleteOption = page.getByRole('menuitem', { name: /delete/i });
    await expect(deleteOption).toBeVisible();
    await deleteOption.click();

    // Confirm deletion in modal
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check confirmation checkbox if present
    const checkbox = modal.getByRole('checkbox');
    if (await checkbox.isVisible().catch(() => false)) {
      await checkbox.click();
    }

    // Click confirm/delete button
    const confirmButton = modal.getByRole('button', { name: /delete|remove|confirm/i });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    // Wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Wait for deletion to complete
    await page.waitForLoadState('networkidle');

    console.log(`[Step 4] Deleted group: ${editedGroupName}`);
  });

  // ==========================================================================
  // Step 5: Verify Cleanup
  // ==========================================================================
  test('Step 5: Verify cleanup - group is gone', async () => {
    // Navigate to User Groups page
    await page.goto('/iam/access-management/users-and-user-groups');
    await page.waitForLoadState('networkidle');

    // Click on User Groups tab
    await page.getByRole('tab', { name: /user groups/i }).click();
    await page.waitForLoadState('networkidle');

    // Verify the group is no longer in the list
    await expect(page.getByText(editedGroupName)).not.toBeVisible({ timeout: 10000 });

    // Also verify original name is not present
    await expect(page.getByText(groupName)).not.toBeVisible();

    console.log(`[Step 5] Verified cleanup: ${editedGroupName} is gone`);
    console.log(`\n[UserGroupLifecycle] Test completed successfully!\n`);
  });
});
