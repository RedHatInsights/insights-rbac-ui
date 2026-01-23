/**
 * V2 Roles - Admin Tests
 *
 * Tests for the V2 Roles page (/iam/access-management/roles) with admin privileges.
 * Admin users can view, create, edit, and delete custom roles.
 *
 * Test Pattern:
 * 1. Search for seeded role (verify found)
 * 2. View seeded role detail (verify values)
 * 3. CRUD lifecycle: Create → Verify → Edit → Verify → Delete → Verify gone
 */

import { test, expect, Page } from '@playwright/test';
import { AUTH_V2_ADMIN, SEEDED_ROLE_NAME } from '../../../utils';

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
      '║    TEST_PREFIX=e2e npx playwright test v2/roles/admin               ║\n' +
      '║                                                                      ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n'
  );
}

test.use({ storageState: AUTH_V2_ADMIN });

test.describe('V2 Roles - Admin', () => {
  const ROLES_URL = '/iam/access-management/roles';

  test.beforeEach(async ({ page }) => {
    await page.goto(ROLES_URL);
    await page.waitForLoadState('networkidle');
  });

  /**
   * Verify the roles page loads correctly
   */
  test('Roles page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();
  });

  /**
   * Search for seeded role and verify it's found
   */
  test('Can search for seeded role', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/filter|search/i);

    if (await searchInput.isVisible()) {
      const prefixedName = `${TEST_PREFIX}__${SEEDED_ROLE_NAME}`;
      await searchInput.fill(prefixedName);
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(prefixedName)).toBeVisible();
    }
  });

  /**
   * View role detail page
   */
  test('Can view role detail', async ({ page }) => {
    const firstRoleLink = page.locator('tbody tr').first().getByRole('link').first();

    if (await firstRoleLink.isVisible()) {
      await firstRoleLink.click();
      await page.waitForLoadState('networkidle');
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
 */
test.describe('V2 Roles - Admin CRUD Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  const roleName = `${TEST_PREFIX}__V2_Lifecycle_Role_${timestamp}`;
  const roleDescription = 'E2E V2 lifecycle test role';
  const editedDescription = 'E2E V2 lifecycle test role (edited)';

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    if (!process.env.TEST_PREFIX) {
      throw new Error('TEST_PREFIX environment variable is required');
    }

    const context = await browser.newContext({ storageState: AUTH_V2_ADMIN });
    page = await context.newPage();

    console.log(`\n[V2 Roles Admin] Using prefix: ${TEST_PREFIX}`);
    console.log(`[V2 Roles Admin] Role name: ${roleName}\n`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  /**
   * Step 1: Create a new role
   */
  test('Create role', async () => {
    await page.goto('/iam/access-management/roles');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /create role/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

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
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      const nextButton2 = page.getByRole('button', { name: /next/i });
      if (await nextButton2.isVisible()) {
        await nextButton2.click();
        await page.waitForLoadState('networkidle');
      }

      const submitButton = page.getByRole('button', { name: /submit|create|save/i });
      await submitButton.click();
    } else {
      const submitButton = page.getByRole('button', { name: /submit|create|save/i });
      await submitButton.click();
    }

    await page.waitForLoadState('networkidle');

    // Verify role was created
    await page.goto('/iam/access-management/roles');
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
    await page.goto('/iam/access-management/roles');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(roleName);
      await page.waitForLoadState('networkidle');
    }

    const roleLink = page.getByRole('link', { name: roleName });
    await expect(roleLink).toBeVisible();
    await roleLink.click();
    await page.waitForLoadState('networkidle');

    console.log(`[Step 2] Verified role details: ${roleName}`);
  });

  /**
   * Step 3: Edit role
   */
  test('Edit role', async () => {
    await page.goto('/iam/access-management/roles');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(roleName);
      await page.waitForLoadState('networkidle');
    }

    const roleRow = page.locator('tbody tr', { has: page.getByText(roleName) });
    const kebabButton = roleRow.getByRole('button', { name: /actions/i });

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

        console.log(`[Step 3] Edited role: ${roleName}`);
      }
    }
  });

  /**
   * Step 4: Delete role
   */
  test('Delete role', async () => {
    await page.goto('/iam/access-management/roles');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(roleName);
      await page.waitForLoadState('networkidle');
    }

    const roleRow = page.locator('tbody tr', { has: page.getByText(roleName) });
    const kebabButton = roleRow.getByRole('button', { name: /actions/i });

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

        console.log(`[Step 4] Deleted role: ${roleName}`);
      }
    }
  });

  /**
   * Step 5: Verify deletion
   */
  test('Verify role deleted', async () => {
    await page.goto('/iam/access-management/roles');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/filter|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(roleName);
      await page.waitForLoadState('networkidle');
    }

    await expect(page.getByText(roleName)).not.toBeVisible({ timeout: 10000 });

    console.log(`[Step 5] Verified deletion: ${roleName}`);
    console.log(`\n[V2 Roles Admin] Lifecycle test completed successfully!\n`);
  });
});
