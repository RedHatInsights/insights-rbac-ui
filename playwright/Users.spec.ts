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
    await page.goto("https://console.stage.redhat.com/iam/user-access/users")
    await page.waitForLoadState("load");

    // expect to land on the Users page
    await expect(page.getByText('These are all of the users in your Red Hat organization. ')).toBeVisible();

    // expect to have a table with an "Org. Administrator column"
    await expect(page.getByRole('columnheader', { name: 'Org. Administrator' }), 'table heading not found').toBeVisible();

  });

  test('org admin column does not appear when the user is not an admin', async({page}) => {
    // see test_org_admin_column_users_table for an equivalent test from the rbac_ui IQE plugin.
    await loginAsNonAdmin(page);
    await page.goto("https://console.stage.redhat.com/iam/user-access/users")
    await page.waitForLoadState("load");
    await expect(page.getByText('You do not have access to User Access Administration')).toBeVisible();
  })
});