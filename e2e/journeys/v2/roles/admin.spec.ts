/**
 * V2 Roles - Admin Tests
 *
 * Tests for the V2 Roles page (/iam/access-management/roles)
 * with admin privileges.
 *
 * Test Pattern:
 * - Use `test.step()` to group related assertions within a single test
 * - Pay the "page load tax" once per test, not per assertion
 * - CRUD lifecycle uses serial mode to maintain state across create → edit → delete
 */

import {
  AUTH_V2_ADMIN,
  Page,
  expect,
  getSeededRoleData,
  getSeededRoleName,
  setupPage,
  test,
  waitForNextEnabled,
  waitForTableUpdate,
} from '../../../utils';

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
      '║    TEST_PREFIX=yourprefix npx playwright test v2/roles              ║\n' +
      '║                                                                      ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

test.use({ storageState: AUTH_V2_ADMIN });

// Get seeded role name and data from seed map/fixture
const SEEDED_ROLE_NAME = getSeededRoleName();
const SEEDED_ROLE_DATA = getSeededRoleData();

test.describe('V2 Roles - Admin', () => {
  const ROLES_URL = '/iam/access-management/roles';

  /**
   * Admin can find and inspect a seeded role
   * Single page load, multiple verification steps
   */
  test('Can find and inspect seeded role', async ({ page }) => {
    test.skip(!SEEDED_ROLE_NAME, 'No seeded role found in seed map');
    await setupPage(page);
    await page.goto(ROLES_URL);
    await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();

    await test.step('Verify Create Role button is visible', async () => {
      const createButton = page.getByRole('button', { name: /create role/i });
      await expect(createButton).toBeVisible();
    });

    await test.step('Search for the seeded role', async () => {
      const searchInput = page.getByPlaceholder(/filter|search/i);
      await searchInput.fill(SEEDED_ROLE_NAME!);

      // Verify the seeded role appears in the table
      await expect(page.getByRole('grid').getByText(SEEDED_ROLE_NAME!)).toBeVisible({ timeout: 10000 });
    });

    await test.step('Navigate to detail view', async () => {
      const roleLink = page.getByRole('grid').getByRole('link', { name: SEEDED_ROLE_NAME! });
      await roleLink.click();

      await expect(page.getByRole('heading', { name: SEEDED_ROLE_NAME! })).toBeVisible({ timeout: 15000 });
    });

    await test.step('Verify role details', async () => {
      // Verify the expected description is visible (if defined in seed fixture)
      if (SEEDED_ROLE_DATA?.description) {
        await expect(page.getByText(SEEDED_ROLE_DATA.description)).toBeVisible({ timeout: 30000 });
      }

      // Verify action buttons are available for admin
      const actionsButton = page.getByRole('button', { name: /actions/i });
      await expect(actionsButton).toBeVisible();
    });
  });
});

/**
 * CRUD Lifecycle Tests
 *
 * These tests run in serial mode to maintain state across:
 * Create → Verify → Edit → Delete → Verify Deleted
 *
 * Structure:
 * 1. "Create role" - Complex wizard flow, needs its own test
 * 2. "Manage role lifecycle" - All post-creation operations in one test with steps
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
    await setupPage(page);

    console.log(`\n[V2 Roles Admin] Using prefix: ${TEST_PREFIX}`);
    console.log(`[V2 Roles Admin] Role name: ${roleName}\n`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  /**
   * Create a new role via the wizard
   */
  test('Create role', async () => {
    await page.goto('/iam/access-management/roles');
    await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();

    await test.step('Open wizard and fill role name', async () => {
      const createButton = page.getByRole('button', { name: /create role/i });
      await expect(createButton).toBeVisible();
      await createButton.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 10000 });

      // Select "Create from scratch" if visible
      const createFromScratchOption = modal.getByRole('radio', { name: /create.*scratch/i });
      if (await createFromScratchOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await createFromScratchOption.click();
      }

      const nameInput = modal.getByLabel(/role name/i);
      await expect(nameInput).toBeVisible({ timeout: 5000 });
      await nameInput.fill(roleName);

      // Wait for async validation (name uniqueness check) by waiting for Next to be enabled
      await waitForNextEnabled(page);
    });

    await test.step('Add permissions', async () => {
      const modal = page.locator('[role="dialog"]');

      const nextButton1 = modal.getByRole('button', { name: /^next$/i }).first();
      await nextButton1.click();

      // Wait for permission checkboxes to appear (indicates step has loaded)
      const permissionCheckboxes = modal.getByRole('checkbox');
      const checkboxCount = await permissionCheckboxes.count();
      if (checkboxCount > 1) {
        await permissionCheckboxes.nth(1).click();
      }

      const nextButton2 = modal.getByRole('button', { name: /^next$/i }).first();
      await expect(nextButton2).toBeEnabled({ timeout: 5000 });
      await nextButton2.click();
    });

    await test.step('Review and submit', async () => {
      const modal = page.locator('[role="dialog"]');

      // Add description if available
      const descriptionInput = modal.locator('textarea').first();
      if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descriptionInput.fill(roleDescription);
      }

      const submitButton = modal.getByRole('button', { name: /submit/i });
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      await submitButton.click();

      // Wait for success screen and exit
      await expect(modal.getByText(/successfully created/i)).toBeVisible({ timeout: 10000 });
      const exitButton = modal.getByRole('button', { name: /exit/i });
      await exitButton.click();

      await expect(modal).not.toBeVisible({ timeout: 5000 });
    });

    await test.step('Verify role appears in list', async () => {
      const searchInput = page.getByPlaceholder(/filter|search/i);
      await searchInput.fill(roleName);
      await expect(page.getByRole('grid').getByText(roleName)).toBeVisible({ timeout: 10000 });
      console.log(`[Create] Created role: ${roleName}`);
    });
  });

  /**
   * Manage role lifecycle: View → Edit → Delete
   * Single page load, multiple operations via steps
   */
  test('Manage role lifecycle', async () => {
    await page.goto('/iam/access-management/roles');
    await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();

    const searchInput = page.getByPlaceholder(/filter|search/i);
    await searchInput.fill(roleName);
    await expect(page.getByRole('grid').getByText(roleName)).toBeVisible({ timeout: 10000 });

    await test.step('View role details', async () => {
      const roleLink = page.getByRole('grid').getByRole('link', { name: roleName });
      await roleLink.click();

      await expect(page.getByRole('heading', { name: roleName })).toBeVisible({ timeout: 10000 });
      console.log(`[View] Verified role details: ${roleName}`);

      // Navigate back to list
      await page.goto('/iam/access-management/roles');
      await expect(page.getByRole('heading', { name: /roles/i })).toBeVisible();
      await searchInput.fill(roleName);
      await expect(page.getByRole('grid').getByText(roleName)).toBeVisible({ timeout: 10000 });
    });

    await test.step('Edit role description', async () => {
      const roleRow = page.locator('tbody tr', { has: page.getByText(roleName) });
      const kebabButton = roleRow.getByRole('button', { name: /actions/i });
      await expect(kebabButton).toBeVisible();
      await kebabButton.click();

      const editOption = page.getByRole('menuitem', { name: /edit/i });
      await expect(editOption).toBeVisible();
      await editOption.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      const descriptionInput = modal.locator('textarea, input[name*="description"]');
      if (await descriptionInput.isVisible()) {
        await descriptionInput.clear();
        await descriptionInput.fill(editedDescription);
      }

      const saveButton = modal.getByRole('button', { name: /save|submit|update/i });
      await expect(saveButton).toBeEnabled();
      await saveButton.click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
      console.log(`[Edit] Edited role: ${roleName}`);
    });

    await test.step('Delete role', async () => {
      await searchInput.clear();
      await searchInput.fill(roleName);
      await expect(page.getByRole('grid').getByText(roleName)).toBeVisible({ timeout: 10000 });

      const roleRow = page.locator('tbody tr', { has: page.getByText(roleName) });
      const kebabButton = roleRow.getByRole('button', { name: /actions/i });
      await expect(kebabButton).toBeVisible();
      await kebabButton.click();

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      await expect(deleteOption).toBeVisible();
      await deleteOption.click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible({ timeout: 5000 });

      const checkbox = modal.getByRole('checkbox');
      if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        await checkbox.click();
      }

      const confirmButton = modal.getByRole('button', { name: /delete|remove|confirm/i });
      await expect(confirmButton).toBeEnabled();
      await confirmButton.click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
      console.log(`[Delete] Deleted role: ${roleName}`);
    });

    await test.step('Verify role is deleted', async () => {
      await searchInput.clear();
      await searchInput.fill(roleName);
      await waitForTableUpdate(page);

      await expect(page.getByRole('grid').getByText(roleName)).not.toBeVisible({ timeout: 10000 });
      console.log(`[Verify] Verified deletion: ${roleName}`);
      console.log(`\n[V2 Roles Admin] Lifecycle test completed successfully!\n`);
    });
  });
});
