/**
 * V2 My User Access - All Personas
 *
 * The My User Access page is accessible to ALL users regardless of role.
 * This parameterized test verifies each persona can access and view the page.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_USER, AUTH_V2_USERADMIN, AUTH_V2_USERVIEWER, setupPage } from '../../utils';

const personas = [
  { name: 'OrgAdmin', auth: AUTH_V2_ADMIN },
  { name: 'UserAdmin', auth: AUTH_V2_USERADMIN },
  { name: 'UserViewer', auth: AUTH_V2_USERVIEWER },
  { name: 'ReadOnlyUser', auth: AUTH_V2_USER },
];

for (const { name, auth } of personas) {
  test.describe(`V2 My User Access - ${name}`, () => {
    test.use({ storageState: auth });

    test('Can access My User Access page', async ({ page }) => {
      await setupPage(page);

      await test.step('Navigate to My User Access', async () => {
        await page.goto('/iam/my-user-access');
        await expect(page).toHaveURL(/\/iam\/my-user-access/);
      });

      await test.step('Verify page content loads', async () => {
        // My User Access page should show the user's permissions
        const pageContent = page.locator('main, [class*="page"], section').first();
        await expect(pageContent).toBeVisible({ timeout: 15000 });
      });
    });
  });
}
