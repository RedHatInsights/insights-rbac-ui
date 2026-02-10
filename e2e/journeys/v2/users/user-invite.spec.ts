/**
 * User Invite Tests
 *
 * Tests for the user invitation functionality.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DECISION TREE - Add your test here if:
 * ═══════════════════════════════════════════════════════════════════════════════
 *   ✓ It invites users (modal, form validation, API)
 *   ✓ It checks if invite button/action is visible/hidden/disabled
 *   ✓ It verifies invite API calls
 *
 * DO NOT add here if:
 *   ✗ It only views the users list → user-list.spec.ts
 *   ✗ It tests search/filter functionality → user-list.spec.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPABILITIES & PERSONAS
 * ═══════════════════════════════════════════════════════════════════════════════
 * @capability Invite Users
 * @personas
 *   - Admin: Can invite users
 *   - UserViewer: Cannot invite users (button disabled)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * DATA PREREQUISITES
 * ═══════════════════════════════════════════════════════════════════════════════
 * @dependencies
 *   - AUTH: Uses AUTH_V2_ADMIN, AUTH_V2_USERVIEWER from utils
 *   - DATA: No seeded data required
 *   - UTILS: Use UsersPage for invite modal interactions
 *
 * CRITICAL: This includes a regression test for the /management URL bug.
 * The external IT API is intercepted to prevent actual emails from being sent.
 */

import { expect, test } from '@playwright/test';
import { AUTH_V2_ADMIN, AUTH_V2_USERVIEWER } from '../../../utils';
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
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe('User Invite', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN - Can invite users
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Admin', () => {
    test.use({ storageState: AUTH_V2_ADMIN });

    test(`Can invite users with correct API URL [Admin]`, async ({ page }) => {
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

      console.log(`[Admin] Invite API called with correct URL: ${apiCall.url}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // USERVIEWER - Cannot invite users (button disabled)
  // ═══════════════════════════════════════════════════════════════════════════
  // UserViewer can see the Users page but cannot invite

  test.describe('UserViewer', () => {
    test.use({ storageState: AUTH_V2_USERVIEWER });

    /**
     * This test documents EXPECTED behavior that is NOT YET IMPLEMENTED.
     * The test will FAIL until the UI disables/hides the invite action for non-admin users.
     *
     * In V2, "Invite new users" is inside the Actions dropdown menu.
     * For non-admin users, this menu item should either be disabled or not visible.
     */
    test(`Invite button is disabled [UserViewer]`, async ({ page }) => {
      const usersPage = new UsersPage(page);
      await usersPage.goto();

      // Open the actions menu
      await usersPage.actionsMenu.click();

      // The invite menu item should be disabled or not visible for non-admin users
      const inviteItem = usersPage.inviteMenuItem;
      const isVisible = await inviteItem.isVisible().catch(() => false);

      if (isVisible) {
        // If visible, it should be disabled
        await expect(inviteItem).toBeDisabled();
      }
      // If not visible, that's also acceptable (hidden from non-admins)
    });
  });
});
