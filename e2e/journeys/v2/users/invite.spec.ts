/**
 * V2 Users - Invite Tests
 *
 * Tests for the user invitation functionality.
 *
 * CRITICAL: This includes a regression test for the /management URL bug.
 * The external IT API is intercepted to prevent actual emails from being sent.
 *
 * Personas that CAN invite: Admin
 * Personas that CANNOT invite: UserViewer, ReadOnlyUser
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_READONLY, AUTH_V2_USERVIEWER } from '../../../utils';
import { UsersPage } from '../../../pages/v2/UsersPage';

// ═══════════════════════════════════════════════════════════════════════════
// IT API Interception Helper
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Set up interception for the IT API invite endpoint.
 * Returns an array that will be populated with API calls.
 *
 * IMPORTANT: This intercepts BOTH the correct and buggy URL patterns
 * so we can verify the correct URL is being used.
 */
async function interceptInviteApi(page: import('@playwright/test').Page) {
  const inviteApiCalls: { url: string; body: unknown }[] = [];

  await page.route(/https:\/\/api\.access\.(stage\.)?redhat\.com\/(management\/)?account\/v1\/accounts\/.*\/users\/invite/, async (route) => {
    const request = route.request();
    const body = request.postDataJSON();

    inviteApiCalls.push({
      url: request.url(),
      body,
    });

    // Return mock success response
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  return inviteApiCalls;
}

// ═══════════════════════════════════════════════════════════════════════════
// Personas that CAN invite users
// ═══════════════════════════════════════════════════════════════════════════

const canInvitePersonas = [{ name: 'Admin', auth: AUTH_V2_ADMIN }];

canInvitePersonas.forEach(({ name, auth }) => {
  test.describe(name, () => {
    test.use({ storageState: auth });

    test(`Can invite users with correct API URL [${name}]`, async ({ page }) => {
      const inviteApiCalls = await interceptInviteApi(page);
      const usersPage = new UsersPage(page);

      await usersPage.goto();

      // Complete invite flow
      await usersPage.openInviteModal();
      await usersPage.fillInviteForm({
        email: 'testuser@example.com',
        message: 'Welcome to our organization!',
      });
      await usersPage.submitInvite();

      // CRITICAL: Verify API was called
      expect(inviteApiCalls.length).toBeGreaterThan(0);

      const apiCall = inviteApiCalls[0];

      // Verify URL does NOT contain /management (this was the bug - regression test)
      expect(apiCall.url).not.toContain('/management/');

      // Verify URL matches expected format
      expect(apiCall.url).toMatch(/https:\/\/api\.access\.(stage\.)?redhat\.com\/account\/v1\/accounts\/\d+\/users\/invite/);

      // Verify email was included in the request
      expect(apiCall.body).toHaveProperty('emails');
      expect((apiCall.body as { emails: string[] }).emails).toContain('testuser@example.com');

      console.log(`[${name}] Invite API called with correct URL: ${apiCall.url}`);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Personas that CANNOT invite users
// ═══════════════════════════════════════════════════════════════════════════

const cannotInvitePersonas = [
  { name: 'UserViewer', auth: AUTH_V2_USERVIEWER },
  { name: 'ReadOnlyUser', auth: AUTH_V2_READONLY },
];

cannotInvitePersonas.forEach(({ name, auth }) => {
  test.describe(name, () => {
    test.use({ storageState: auth });

    /**
     * This test documents EXPECTED behavior that is NOT YET IMPLEMENTED.
     * The test will FAIL until the UI disables the invite button for non-admin users.
     *
     * TODO: Remove this comment once the UI is fixed.
     */
    test(`Invite button is disabled [${name}]`, async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // The invite button should be disabled for non-admin users
      // NOTE: This test will FAIL if the button is visible and enabled
      await expect(usersPage.inviteButton).toBeDisabled();
    });
  });
});
