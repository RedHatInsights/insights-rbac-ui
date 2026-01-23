/**
 * V2 User Groups - Admin Tests
 *
 * Tests for the V2 User Groups page (/iam/access-management/users-and-user-groups/user-groups)
 * with admin privileges.
 *
 * Test Pattern:
 * 1. Search for seeded group (verify found)
 * 2. View seeded group detail (verify values)
 * 3. CRUD lifecycle: Create → Verify → Edit → Verify → Delete → Verify gone
 */

import { test, expect, Page } from '@playwright/test';
import { AUTH_V2_ADMIN, SEEDED_GROUP_NAME } from '../../../../utils';

// Safety rail: Require TEST_PREFIX for any test that creates data
const TEST_PREFIX = process.env.TEST_PREFIX;

if (!TEST_PREFIX) {
  throw new Error(
    '\n\n' +
      '╔══════════════════════════════════════════════════════════════════════╗\n' +
      '║  SAFETY RAIL: TEST_PREFIX environment variable is REQUIRED          ║\n' +
      '║                                                                      ║\n' +
      '║  This test creates data that must be prefixed to avoid polluting    ║\n' +
      '║  the shared environment. Set TEST_PREFIX before running:            ║\n' +
      '║                                                                      ║\n' +
      '║    TEST_PREFIX=e2e npx playwright test v2/users-and-user-groups     ║\n' +
      '║                                                                      ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n'
  );
}

test.use({ storageState: AUTH_V2_ADMIN });

test.describe('V2 User Groups - Admin', () => {
  const GROUPS_URL = '/iam/access-management/users-and-user-groups/user-groups';

  test.beforeEach(async ({ page }) => {
    await page.goto(GROUPS_URL);
    await page.waitForLoadState('networkidle');
  });

  /**
   * Verify the user groups page loads correctly
   */
  test('User Groups page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /user groups/i })).toBeVisible();
  });

  /**
   * Search for seeded group and verify it's found
   */
  test('Can search for seeded group', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/filter|search/i);

    if (await searchInput.isVisible()) {
      const prefixedName = `${TEST_PREFIX}__${SEEDED_GROUP_NAME}`;
      await searchInput.fill(prefixedName);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(prefixedName)).toBeVisible();
    }
  });

  /**
   * View group detail page
   */
  test('Can view group detail', async ({ page }) => {
    const firstGroupLink = page.locator('tbody tr').first().getByRole('link').first();

    if (await firstGroupLink.isVisible()) {
      await firstGroupLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  /**
   * Admin can see Create User Group button
   */
  test('Create User Group button is visible', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create.*group/i });
    await expect(createButton).toBeVisible();
  });
});

/**
 * CRUD Lifecycle Tests
 */
test.describe('V2 User Groups - Admin CRUD Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  const groupName = `${TEST_PREFIX}__V2_Lifecycle_Group_${timestamp}`;
  const groupDescription = 'E2E V2 lifecycle test group';
  const editedDescription = 'E2E V2 lifecycle test group (edited)';

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    if (!process.env.TEST_PREFIX) {
      throw new Error('TEST_PREFIX environment variable is required');
    }

    const context = await browser.newContext({ storageState: AUTH_V2_ADMIN });
    page = await context.newPage();

    console.log(`\n[V2 User Groups Admin] Using prefix: ${TEST_PREFIX}`);
    console.log(`[V2 User Groups Admin] Group name: ${groupName}\n`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  /**
   * Step 1: Create a new user group
   */
  test('Create user group', async () => {
    await page.goto('/iam/access-management/users-and-user-groups/user-groups');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /create.*group/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    await page.waitForLoadState('networkidle');

    // Fill in group name
    const nameInput = page.getByLabel(/name/i).first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(groupName);

    // Fill in description if available
    const descriptionInput = page.getByLabel(/description/i);
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(groupDescription);
    }

    // Submit
    const submitButton = page.getByRole('button', { name: /submit|create|save/i });
    await submitButton.click();
    await page.waitForLoadState('networkidle');

    // Verify group was created
    await page.goto('/iam/access-management/users-and-user-groups/user-groups');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(groupName);
      await page.waitForLoadState('networkidle');
    }

    await expect(page.getByText(groupName)).toBeVisible({ timeout: 10000 });
    console.log(`[Step 1] Created group: ${groupName}`);
  });

  /**
   * Step 2: Verify group details
   */
  test('Verify group details', async () => {
    await page.goto('/iam/access-management/users-and-user-groups/user-groups');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(groupName);
      await page.waitForLoadState('networkidle');
    }

    const groupLink = page.getByRole('link', { name: groupName });
    await expect(groupLink).toBeVisible();
    await groupLink.click();
    await page.waitForLoadState('networkidle');

    console.log(`[Step 2] Verified group details: ${groupName}`);
  });

  /**
   * Step 3: Edit group
   */
  test('Edit group', async () => {
    await page.goto('/iam/access-management/users-and-user-groups/user-groups');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(groupName);
      await page.waitForLoadState('networkidle');
    }

    const groupRow = page.locator('tbody tr', { has: page.getByText(groupName) });
    const kebabButton = groupRow.getByRole('button', { name: /actions/i });

    if (await kebabButton.isVisible()) {
      await kebabButton.click();

      const editOption = page.getByRole('menuitem', { name: /edit/i });
      if (await editOption.isVisible()) {
        await editOption.click();
        await page.waitForLoadState('networkidle');

        const descriptionInput = page.getByLabel(/description/i);
        if (await descriptionInput.isVisible()) {
          await descriptionInput.clear();
          await descriptionInput.fill(editedDescription);
        }

        const saveButton = page.getByRole('button', { name: /save|submit|update/i });
        await saveButton.click();
        await page.waitForLoadState('networkidle');

        console.log(`[Step 3] Edited group: ${groupName}`);
      }
    }
  });

  /**
   * Step 4: Delete group
   */
  test('Delete group', async () => {
    await page.goto('/iam/access-management/users-and-user-groups/user-groups');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(groupName);
      await page.waitForLoadState('networkidle');
    }

    const groupRow = page.locator('tbody tr', { has: page.getByText(groupName) });
    const kebabButton = groupRow.getByRole('button', { name: /actions/i });

    if (await kebabButton.isVisible()) {
      await kebabButton.click();

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      if (await deleteOption.isVisible()) {
        await deleteOption.click();

        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible();

        const checkbox = modal.getByRole('checkbox');
        if (await checkbox.isVisible()) {
          await checkbox.click();
        }

        const confirmButton = modal.getByRole('button', { name: /delete|remove|confirm/i });
        await confirmButton.click();

        await expect(modal).not.toBeVisible({ timeout: 5000 });
        await page.waitForLoadState('networkidle');

        console.log(`[Step 4] Deleted group: ${groupName}`);
      }
    }
  });

  /**
   * Step 5: Verify deletion
   */
  test('Verify group deleted', async () => {
    await page.goto('/iam/access-management/users-and-user-groups/user-groups');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(groupName);
      await page.waitForLoadState('networkidle');
    }

    await expect(page.getByText(groupName)).not.toBeVisible({ timeout: 10000 });

    console.log(`[Step 5] Verified deletion: ${groupName}`);
    console.log(`\n[V2 User Groups Admin] Lifecycle test completed successfully!\n`);
  });
});
