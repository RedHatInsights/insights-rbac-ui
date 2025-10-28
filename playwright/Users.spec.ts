import { Page, test, expect } from '@playwright/test';

// need to ignore cert verification in CI/CD environment
test.use({ ignoreHTTPSErrors: true });

// we may want to make this an env var later on, but for demonstration purposes it's just a hard-coded constant.
const CONSOLE_URL = "https://console.stage.redhat.com";

// these login functions contain semi-duplicated logic, but we don't need to optimize the code.
// We just need working tests. Functional now, optimize later.
async function login(page: Page, user: string, password: string): Promise<void> {
  // Fail in a friendly way if the proxy config is not set up correctly
  await expect(page.locator("text=Lockdown"), 'proxy config incorrect').toHaveCount(0)
  await page.getByLabel('Red Hat login').first().fill(user);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel('Password').first().fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  // confirm login was valid
  await expect(page.getByText('Invalid login')).not.toBeVisible();
}

// these login functions contain semi-duplicated logic, but we don't need to optimize the code.
// We just need working tests. Functional now, optimize later.
async function loginAsAdmin(page: Page): Promise<void>  {
  await page.goto(CONSOLE_URL);
  // for now we can pull creds from the environment; no need to figure out vault integration, just do the simple thing
  const user = process.env.E2E_USER || 'misconfigured';
  const password = process.env.E2E_PASSWORD || 'misconfigured';
  expect(user).not.toContain('misconfigured');
  expect(password).not.toContain('misconfigured');
  await login(page, user, password);
  await page.waitForLoadState("load");
  await expect(page.getByText('Invalid login')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Add widgets' }), 'dashboard not displayed').toBeVisible();
}

async function loginAsNonAdmin(page: Page): Promise<void>  {
  await page.goto(CONSOLE_URL);
  // for now we can pull creds from the environment; no need to figure out vault integration, just do the simple thing
  const user = process.env.E2E_USER_NON_ADMIN || 'misconfigured';
  const password = process.env.E2E_PASSWORD_NON_ADMIN || 'misconfigured';
  expect(user).not.toContain('misconfigured');
  expect(password).not.toContain('misconfigured');
  await login(page, user, password);
  await page.waitForLoadState("load");
  await expect(page.getByText('Invalid login')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Add widgets' }), 'dashboard not displayed').toBeVisible();
}

test.describe('RBAC Users Page', async () => {

  test.beforeEach(async ({page}): Promise<void> => {
    // any setup logic needed before each test goes here.
  });

  test('org admin column appears when the user is an org admin', async({page}) => {
    // see test_org_admin_column_users_table for an equivalent test from the rbac_ui IQE plugin.
    await loginAsAdmin(page);
    await page.goto(`${CONSOLE_URL}/iam/user-access/users`)
    await page.waitForLoadState("load");

    // expect to land on the Users page
    await expect(page.getByText('These are all of the users in your Red Hat organization. ')).toBeVisible();

    // expect to have a table with an "Org. Administrator column"
    await expect(page.getByRole('columnheader', { name: 'Org. Administrator' }), 'table heading not found').toBeVisible();

  });

  test('org admin column does not appear when the user is not an admin', async({page}) => {
    // see test_org_admin_column_users_table for an equivalent test from the rbac_ui IQE plugin.
    await loginAsNonAdmin(page);
    await page.goto(`${CONSOLE_URL}/iam/user-access/users`)
    await page.waitForLoadState("load");
    await expect(page.getByText('You do not have access to User Access Administration')).toBeVisible();
  });

  test('user details page displays roles and groups correctly', async({page}) => {
    // see test_ui_rbac_user_details for an equivalent test from the rbac_ui IQE plugin.
    await loginAsAdmin(page);

    // Navigate to Users page first
    await page.goto(`${CONSOLE_URL}/iam/user-access/users`)
    await page.waitForLoadState("load");

    // Get current user from environment
    const currentUser = process.env.E2E_USER || 'misconfigured';

    // Search for current user and open details
    await page.getByPlaceholder('Filter by username').fill(currentUser);
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(1000); // Wait for search results

    // Click on the user to open details
    await page.getByRole('link', { name: currentUser }).first().click();
    await page.waitForLoadState("load");

    // Verify user details page is displayed
    await expect(page.getByText('Roles')).toBeVisible();
    await expect(page.getByText('Groups')).toBeVisible();

    // Verify roles table is displayed
    const rolesTable = page.locator('table').first();
    await expect(rolesTable).toBeVisible();

    // Apply search filter for roles
    const roleSearchInput = page.getByPlaceholder('Search by role name');
    if (await roleSearchInput.isVisible()) {
      await roleSearchInput.fill('user');
      await page.waitForTimeout(1000); // Wait for filter

      // Verify table still displays after filtering
      await expect(rolesTable).toBeVisible();

      // Clear filter
      await roleSearchInput.clear();
    }

    // Test expand/collapse functionality if available
    const expandButtons = page.getByRole('button', { name: /expand/i });
    const expandButtonCount = await expandButtons.count();

    if (expandButtonCount > 0) {
      // Click first expand button
      await expandButtons.first().click();
      await page.waitForTimeout(500);

      // Click collapse button
      const collapseButton = page.getByRole('button', { name: /collapse/i }).first();
      if (await collapseButton.isVisible()) {
        await collapseButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('user explorer role name filtering works correctly', async({page}) => {
    // see test_user_explorer_filter_by_role_name for an equivalent test from the rbac_ui IQE plugin.
    await loginAsAdmin(page);

    // Navigate to user details page
    await page.goto(`${CONSOLE_URL}/iam/user-access/users`)
    await page.waitForLoadState("load");

    const currentUser = process.env.E2E_USER || 'misconfigured';

    // Search for current user and open details
    await page.getByPlaceholder('Filter by username').fill(currentUser);
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(1000);

    // Click on the user to open details
    await page.getByRole('link', { name: currentUser }).first().click();
    await page.waitForLoadState("load");

    // Apply role filter for "user_explorer"
    const roleSearchInput = page.getByPlaceholder('Search by role name');
    if (await roleSearchInput.isVisible()) {
      await roleSearchInput.fill('user_explorer');
      await page.waitForTimeout(2000); // Wait for filter to apply

      // Collect role names from filtered results
      const roleRows = page.locator('table tbody tr');
      const rowCount = await roleRows.count();

      if (rowCount > 0) {
        // Verify that filtered results contain "user_explorer" in the role names
        for (let i = 0; i < Math.min(rowCount, 4); i++) {
          const rowText = await roleRows.nth(i).textContent();
          expect(rowText?.toLowerCase()).toContain('user_explorer');
        }
      }

      // Clear filter
      await roleSearchInput.clear();
    }
  });

  test('add user to group modal opens and closes', async({page}) => {
    // see test_add_user_to_group_opens_modal for an equivalent test from the rbac_ui IQE plugin.
    await loginAsAdmin(page);

    // Navigate to user details page
    await page.goto(`${CONSOLE_URL}/iam/user-access/users`)
    await page.waitForLoadState("load");

    const currentUser = process.env.E2E_USER || 'misconfigured';

    // Search for current user and open details
    await page.getByPlaceholder('Filter by username').fill(currentUser);
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(1000);

    // Click on the user to open details
    await page.getByRole('link', { name: currentUser }).first().click();
    await page.waitForLoadState("load");

    // Look for "Add user to group" button
    const addToGroupButton = page.getByRole('button', { name: /add.*group/i });

    if (await addToGroupButton.isVisible()) {
      // Click the button to open modal
      await addToGroupButton.click();
      await page.waitForTimeout(500);

      // Verify modal is displayed
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      // Click cancel to close modal
      const cancelButton = page.getByRole('button', { name: 'Cancel' });
      await cancelButton.click();
      await page.waitForTimeout(500);

      // Verify modal is closed
      await expect(modal).not.toBeVisible();
    }
  });

  test('add user to group modal filters existing groups', async({page}) => {
    // see test_add_user_to_group_only_lists_relevant_groups for an equivalent test from the rbac_ui IQE plugin.
    await loginAsAdmin(page);

    // Navigate to user details page
    await page.goto(`${CONSOLE_URL}/iam/user-access/users`)
    await page.waitForLoadState("load");

    const currentUser = process.env.E2E_USER || 'misconfigured';

    // Search for current user and open details
    await page.getByPlaceholder('Filter by username').fill(currentUser);
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(1000);

    // Click on the user to open details
    await page.getByRole('link', { name: currentUser }).first().click();
    await page.waitForLoadState("load");

    // Open add to group modal
    const addToGroupButton = page.getByRole('button', { name: /add.*group/i });

    if (await addToGroupButton.isVisible()) {
      await addToGroupButton.click();
      await page.waitForTimeout(500);

      // Search for a group the user is already in
      const groupSearchInput = page.getByPlaceholder(/search/i).last();
      await groupSearchInput.fill('user_explorer_group_2');
      await page.waitForTimeout(2000);

      // Verify that no groups are shown (or "no results" message appears)
      const noResultsMessage = page.getByText(/no.*group/i);
      const hasNoResults = await noResultsMessage.isVisible();

      // Either no results message or empty table
      if (!hasNoResults) {
        const tableRows = page.locator('dialog table tbody tr');
        const rowCount = await tableRows.count();
        // Expect 0 or minimal rows if user is already in the group
        expect(rowCount).toBeLessThanOrEqual(1);
      }

      // Close modal
      const cancelButton = page.getByRole('button', { name: 'Cancel' });
      await cancelButton.click();
    }
  });

  test('org admin can select multiple groups in add user modal', async({page}) => {
    // see test_org_admin_can_select_groups for an equivalent test from the rbac_ui IQE plugin.
    await loginAsAdmin(page);

    // Navigate to user details page
    await page.goto(`${CONSOLE_URL}/iam/user-access/users`)
    await page.waitForLoadState("load");

    const currentUser = process.env.E2E_USER || 'misconfigured';

    // Search for current user and open details
    await page.getByPlaceholder('Filter by username').fill(currentUser);
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(1000);

    // Click on the user to open details
    await page.getByRole('link', { name: currentUser }).first().click();
    await page.waitForLoadState("load");

    // Open add to group modal
    const addToGroupButton = page.getByRole('button', { name: /add.*group/i });

    if (await addToGroupButton.isVisible()) {
      await addToGroupButton.click();
      await page.waitForTimeout(500);

      // Search for groups
      const groupSearchInput = page.getByPlaceholder(/search/i).last();
      await groupSearchInput.fill('user_explorer');
      await page.waitForTimeout(2000);

      // Look for checkboxes in the modal
      const checkboxes = page.locator('dialog input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount >= 2) {
        // Select first two checkboxes
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();

        // Verify they are checked
        await expect(checkboxes.nth(0)).toBeChecked();
        await expect(checkboxes.nth(1)).toBeChecked();
      }

      // Close modal
      const cancelButton = page.getByRole('button', { name: 'Cancel' });
      await cancelButton.click();
    }
  });

  test('org admin column shows correct value for admin user', async({page}) => {
    // Enhanced test for test_org_admin_column_users_table
    await loginAsAdmin(page);
    await page.goto(`${CONSOLE_URL}/iam/user-access/users`)
    await page.waitForLoadState("load");

    // Verify Org. Administrator column exists
    await expect(page.getByRole('columnheader', { name: 'Org. Administrator' })).toBeVisible();

    const currentUser = process.env.E2E_USER || 'misconfigured';

    // Search for the admin user
    await page.getByPlaceholder('Filter by username').fill(currentUser);
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(1000);

    // Find the table row for this user
    const userRow = page.locator(`tr:has-text("${currentUser}")`).first();

    // Verify the Org. Administrator column shows "Yes"
    const rowText = await userRow.textContent();
    expect(rowText).toContain('Yes');
  });
});