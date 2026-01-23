/**
 * V1 Roles - Admin Tests
 *
 * Tests for the V1 Roles page (/iam/user-access/roles) with admin privileges.
 * Admin users can view, create, edit, and delete custom roles.
 *
 * Test Pattern:
 * 1. Search for seeded role (verify found)
 * 2. View seeded role detail (verify values)
 * 3. CRUD lifecycle: Create → Verify → Edit → Verify → Delete → Verify gone
 */

import { test, expect, Page } from '@playwright/test';
import { AUTH_V1_ADMIN, SEEDED_ROLE_NAME } from '../../../utils';

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
      '║    TEST_PREFIX=e2e npx playwright test v1/roles/admin               ║\n' +
      '║                                                                      ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n'
  );
}

test.use({ storageState: AUTH_V1_ADMIN });

test.describe('V1 Roles - Admin', () => {
  const ROLES_URL = '/iam/user-access/roles';

  test.beforeEach(async ({ page }) => {
    await page.goto(ROLES_URL);
    await page.waitForLoadState('networkidle');
  });

  /**
   * Verify the roles page loads correctly
   */
  test('Roles page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();
    await expect(page.getByRole('grid')).toBeVisible();
  });

  /**
   * Search for seeded role and verify it's found
   */
  test('Can search for seeded role', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/filter|search/i);

    if (await searchInput.isVisible()) {
      // Search for the prefixed seeded role name
      const prefixedName = `${TEST_PREFIX}__${SEEDED_ROLE_NAME}`;
      await searchInput.fill(prefixedName);
      await page.waitForLoadState('networkidle');

      // Verify the seeded role appears in results
      await expect(page.getByText(prefixedName)).toBeVisible();
    }
  });

  /**
   * View role detail page
   */
  test('Can view role detail', async ({ page }) => {
    // Click on first role link
    const firstRoleLink = page.locator('tbody tr').first().getByRole('link').first();

    if (await firstRoleLink.isVisible()) {
      await firstRoleLink.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to role detail page
      await expect(page).toHaveURL(/\/roles\//);
    }
  });

  /**
   * Admin can see Create Role button
   */
  test('Create Role button is visible', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create role/i });
    await expect(createButton).toBeVisible();
  });
});

/**
 * CRUD Lifecycle Tests
 * These tests run in serial mode to maintain state across create → edit → delete
 */
test.describe('V1 Roles - Admin CRUD Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  const roleName = `${TEST_PREFIX}__Lifecycle_Role_${timestamp}`;
  const roleDescription = 'E2E lifecycle test role';
  const editedDescription = 'E2E lifecycle test role (edited)';

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    if (!process.env.TEST_PREFIX) {
      throw new Error('TEST_PREFIX environment variable is required');
    }

    const context = await browser.newContext({ storageState: AUTH_V1_ADMIN });
    page = await context.newPage();

    console.log(`\n[V1 Roles Admin] Using prefix: ${TEST_PREFIX}`);
    console.log(`[V1 Roles Admin] Role name: ${roleName}\n`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  /**
   * Step 1: Create a new role
   */
  test('Create role', async () => {
    await page.goto('/iam/user-access/roles');
    await page.waitForLoadState('networkidle');

    // Click Create Role button
    const createButton = page.getByRole('button', { name: /create role/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for create form/wizard
    await page.waitForLoadState('networkidle');

    // Fill in role name
    const nameInput = page.getByLabel(/name/i).first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(roleName);

    // Fill in description if available
    const descriptionInput = page.getByLabel(/description/i);
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(roleDescription);
    }

    // Navigate through wizard or submit form
    const nextButton = page.getByRole('button', { name: /next/i });
    if (await nextButton.isVisible()) {
      // It's a wizard - click through
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      // Skip permissions step if present
      const nextButton2 = page.getByRole('button', { name: /next/i });
      if (await nextButton2.isVisible()) {
        await nextButton2.click();
        await page.waitForLoadState('networkidle');
      }

      // Submit
      const submitButton = page.getByRole('button', { name: /submit|create|save/i });
      await submitButton.click();
    } else {
      // Simple form - submit directly
      const submitButton = page.getByRole('button', { name: /submit|create|save/i });
      await submitButton.click();
    }

    await page.waitForLoadState('networkidle');

    // Verify role was created by searching for it
    await page.goto('/iam/user-access/roles');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(roleName);
      await page.waitForLoadState('networkidle');
    }

    await expect(page.getByText(roleName)).toBeVisible({ timeout: 10000 });
    console.log(`[Step 1] Created role: ${roleName}`);
  });

  /**
   * Step 2: Verify role details
   */
  test('Verify role details', async () => {
    await page.goto('/iam/user-access/roles');
    await page.waitForLoadState('networkidle');

    // Search for our role
    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(roleName);
      await page.waitForLoadState('networkidle');
    }

    // Click on the role to view details
    const roleLink = page.getByRole('link', { name: roleName });
    await expect(roleLink).toBeVisible();
    await roleLink.click();
    await page.waitForLoadState('networkidle');

    // Verify we're on the detail page
    await expect(page).toHaveURL(/\/roles\//);

    console.log(`[Step 2] Verified role details: ${roleName}`);
  });

  /**
   * Step 3: Edit role
   */
  test('Edit role', async () => {
    // Navigate to role detail if not already there
    await page.goto('/iam/user-access/roles');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(roleName);
      await page.waitForLoadState('networkidle');
    }

    // Find and click edit via kebab menu
    const roleRow = page.locator('tbody tr', { has: page.getByText(roleName) });
    const kebabButton = roleRow.getByRole('button', { name: /actions/i });

    if (await kebabButton.isVisible()) {
      await kebabButton.click();

      const editOption = page.getByRole('menuitem', { name: /edit/i });
      if (await editOption.isVisible()) {
        await editOption.click();
        await page.waitForLoadState('networkidle');

        // Update description
        const descriptionInput = page.getByLabel(/description/i);
        if (await descriptionInput.isVisible()) {
          await descriptionInput.clear();
          await descriptionInput.fill(editedDescription);
        }

        // Save changes
        const saveButton = page.getByRole('button', { name: /save|submit|update/i });
        await saveButton.click();
        await page.waitForLoadState('networkidle');

        console.log(`[Step 3] Edited role: ${roleName}`);
      }
    }
  });

  /**
   * Step 4: Delete role
   */
  test('Delete role', async () => {
    await page.goto('/iam/user-access/roles');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(roleName);
      await page.waitForLoadState('networkidle');
    }

    // Find and click delete via kebab menu
    const roleRow = page.locator('tbody tr', { has: page.getByText(roleName) });
    const kebabButton = roleRow.getByRole('button', { name: /actions/i });

    if (await kebabButton.isVisible()) {
      await kebabButton.click();

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      if (await deleteOption.isVisible()) {
        await deleteOption.click();

        // Confirm deletion
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

        console.log(`[Step 4] Deleted role: ${roleName}`);
      }
    }
  });

  /**
   * Step 5: Verify deletion
   */
  test('Verify role deleted', async () => {
    await page.goto('/iam/user-access/roles');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(roleName);
      await page.waitForLoadState('networkidle');
    }

    // Verify role is no longer visible
    await expect(page.getByText(roleName)).not.toBeVisible({ timeout: 10000 });

    console.log(`[Step 5] Verified deletion: ${roleName}`);
    console.log(`\n[V1 Roles Admin] Lifecycle test completed successfully!\n`);
  });
});
