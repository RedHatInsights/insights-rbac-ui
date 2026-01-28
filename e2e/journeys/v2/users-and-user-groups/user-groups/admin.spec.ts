/**
 * V2 User Groups - Admin Tests
 *
 * Tests for the V2 User Groups page (/iam/access-management/users-and-user-groups/user-groups)
 * with admin privileges.
 *
 * Test Pattern:
 * - Use `test.step()` to group related assertions within a single test
 * - Pay the "page load tax" once per test, not per assertion
 * - CRUD lifecycle uses serial mode to maintain state across create → edit → delete
 */

import { AUTH_V2_ADMIN, Page, expect, getSeededGroupData, getSeededGroupName, setupPage, test, waitForTableUpdate } from '../../../../utils';

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
      '║    TEST_PREFIX=yourprefix npx playwright test v2/user-groups        ║\n' +
      '║                                                                      ║\n' +
      '╚══════════════════════════════════════════════════════════════════════╝\n',
  );
}

test.use({ storageState: AUTH_V2_ADMIN });

// Get seeded group name and data from seed map/fixture
const SEEDED_GROUP_NAME = getSeededGroupName();
const SEEDED_GROUP_DATA = getSeededGroupData();

test.describe('V2 User Groups - Admin', () => {
  const GROUPS_URL = '/iam/access-management/users-and-user-groups/user-groups';

  /**
   * Admin can find and inspect a seeded group
   * Single page load, multiple verification steps
   */
  test('Can find and inspect seeded group', async ({ page }) => {
    test.skip(!SEEDED_GROUP_NAME, 'No seeded group found in seed map');
    await setupPage(page);
    await page.goto(GROUPS_URL);
    await expect(page.getByRole('heading', { name: /user groups/i })).toBeVisible();

    await test.step('Verify Create User Group button is visible', async () => {
      const createButton = page.getByRole('button', { name: /create.*group/i });
      await expect(createButton).toBeVisible();
    });

    await test.step('Search for the seeded group', async () => {
      const searchInput = page.getByPlaceholder(/filter|search/i);
      await searchInput.fill(SEEDED_GROUP_NAME!);

      // Verify the seeded group appears in the table
      await expect(page.getByRole('grid').getByText(SEEDED_GROUP_NAME!)).toBeVisible({ timeout: 10000 });
    });

    await test.step('Navigate to detail view', async () => {
      const groupLink = page.getByRole('grid').getByRole('link', { name: SEEDED_GROUP_NAME! });
      await groupLink.click();

      await expect(page.getByRole('heading', { name: SEEDED_GROUP_NAME! })).toBeVisible({ timeout: 15000 });
    });

    await test.step('Verify group details', async () => {
      // Verify the expected description is visible (if defined in seed fixture)
      if (SEEDED_GROUP_DATA?.description) {
        await expect(page.getByText(SEEDED_GROUP_DATA.description)).toBeVisible({ timeout: 30000 });
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
 * 1. "Create user group" - Complex wizard flow, needs its own test
 * 2. "Manage user group lifecycle" - All post-creation operations in one test with steps
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
    await setupPage(page);

    console.log(`\n[V2 User Groups Admin] Using prefix: ${TEST_PREFIX}`);
    console.log(`[V2 User Groups Admin] Group name: ${groupName}\n`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  /**
   * Create a new user group via the wizard
   */
  test('Create user group', async () => {
    await page.goto('/iam/access-management/users-and-user-groups/user-groups');
    await expect(page.getByRole('heading', { name: /user groups/i })).toBeVisible();

    await test.step('Open wizard and fill name/description', async () => {
      const createButton = page.getByRole('button', { name: /create.*group/i });
      await expect(createButton).toBeVisible();
      await createButton.click();

      const nameInput = page.locator('#group-name');
      await expect(nameInput).toBeVisible({ timeout: 10000 });
      await nameInput.fill(groupName);

      const descriptionInput = page.locator('#group-description');
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill(groupDescription);
      }
    });

    await test.step('Navigate through wizard steps', async () => {
      const clickWizardNext = async () => {
        const nextButton = page.locator('[role="dialog"]').getByRole('button', { name: /next/i }).first();
        await expect(nextButton).toBeEnabled({ timeout: 10000 });
        await nextButton.click();
      };

      // Navigate through wizard steps - clickWizardNext waits for button to be enabled
      await clickWizardNext();
      await clickWizardNext();
      await clickWizardNext();

      // Check if on Review or need one more Next
      const reviewHeading = page
        .locator('[role="dialog"]')
        .getByText(/review/i)
        .first();
      if (!(await reviewHeading.isVisible({ timeout: 1000 }).catch(() => false))) {
        await clickWizardNext();
      }
    });

    await test.step('Review and submit', async () => {
      const reviewHeading = page
        .locator('[role="dialog"]')
        .getByText(/review/i)
        .first();
      await expect(reviewHeading).toBeVisible({ timeout: 5000 });

      const submitButton = page
        .locator('[role="dialog"]')
        .getByRole('button', { name: /submit|create/i })
        .first();
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      await submitButton.click();

      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 15000 });
    });

    await test.step('Verify group appears in list', async () => {
      const searchInput = page.getByPlaceholder(/filter|search/i);
      await searchInput.fill(groupName);
      await expect(page.getByRole('grid').getByText(groupName)).toBeVisible({ timeout: 10000 });
      console.log(`[Create] Created group: ${groupName}`);
    });
  });

  /**
   * Manage user group lifecycle: View → Edit → Delete
   * Single page load, multiple operations via steps
   */
  test('Manage user group lifecycle', async () => {
    await page.goto('/iam/access-management/users-and-user-groups/user-groups');
    await expect(page.getByRole('heading', { name: /user groups/i })).toBeVisible();

    const searchInput = page.getByPlaceholder(/filter|search/i);
    await searchInput.fill(groupName);
    await expect(page.getByRole('grid').getByText(groupName)).toBeVisible({ timeout: 10000 });

    await test.step('View group details', async () => {
      const groupLink = page.getByRole('grid').getByRole('link', { name: groupName });
      await groupLink.click();

      await expect(page.getByRole('heading', { name: groupName })).toBeVisible({ timeout: 10000 });
      console.log(`[View] Verified group details: ${groupName}`);

      // Navigate back to list
      await page.goto('/iam/access-management/users-and-user-groups/user-groups');
      await expect(page.getByRole('heading', { name: /user groups/i })).toBeVisible();
      await searchInput.fill(groupName);
      await expect(page.getByRole('grid').getByText(groupName)).toBeVisible({ timeout: 10000 });
    });

    await test.step('Edit group description', async () => {
      const groupRow = page.locator('tbody tr', { has: page.getByText(groupName) });
      const kebabButton = groupRow.getByRole('button', { name: /actions/i });
      await expect(kebabButton).toBeVisible();
      await kebabButton.click();

      const editOption = page.getByRole('menuitem', { name: /edit/i });
      await expect(editOption).toBeVisible();
      await editOption.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 5000 });

      const descriptionInput = modal.locator('textarea, input[name*="description"], #group-description');
      if (await descriptionInput.isVisible()) {
        await descriptionInput.clear();
        await descriptionInput.fill(editedDescription);
      }

      const saveButton = modal.getByRole('button', { name: /save|submit|update/i });
      await expect(saveButton).toBeEnabled();
      await saveButton.click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
      console.log(`[Edit] Edited group: ${groupName}`);
    });

    await test.step('Delete group', async () => {
      await searchInput.clear();
      await searchInput.fill(groupName);
      await expect(page.getByRole('grid').getByText(groupName)).toBeVisible({ timeout: 10000 });

      const groupRow = page.locator('tbody tr', { has: page.getByText(groupName) });
      const kebabButton = groupRow.getByRole('button', { name: /actions/i });
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
      console.log(`[Delete] Deleted group: ${groupName}`);
    });

    await test.step('Verify group is deleted', async () => {
      await searchInput.clear();
      await searchInput.fill(groupName);
      await waitForTableUpdate(page);

      await expect(page.getByRole('grid').getByText(groupName)).not.toBeVisible({ timeout: 10000 });
      console.log(`[Verify] Verified deletion: ${groupName}`);
      console.log(`\n[V2 User Groups Admin] Lifecycle test completed successfully!\n`);
    });
  });
});
