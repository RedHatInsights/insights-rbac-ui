import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
import {
  Story,
  TEST_TIMEOUTS,
  USER_JOHN,
  db,
  inviteUsersSpyV2,
  meta,
  pollUntilTrue,
  resetStoryState,
  verifySuccessNotification,
  waitForPageToLoad,
} from './_v2OrgAdminSetup';

export default {
  ...meta,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Users and Groups',
  tags: ['prod-v2-org-admin'],
};

// Expected URL pattern for invite users API (stage environment in tests)
// Format: https://api.access.stage.redhat.com/account/v1/accounts/{accountId}/users/invite
const EXPECTED_INVITE_URL_PATTERN_V2 = /^https:\/\/api\.access\.(stage\.)?redhat\.com\/account\/v1\/accounts\/\d+\/users\/invite$/;

/**
 * Users and User Groups - Full Flow
 */
export const UsersAndUserGroupsFlow: Story = {
  name: 'Users and User Groups Flow',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the new Users and User Groups page functionality.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Verify Users tab is active
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    await pollUntilTrue(() => usersTab.getAttribute('aria-selected') === 'true');

    // Switch to User Groups tab
    const groupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(groupsTab);
    await pollUntilTrue(() => groupsTab.getAttribute('aria-selected') === 'true');

    // Switch back to Users
    await user.click(usersTab);
    await pollUntilTrue(() => usersTab.getAttribute('aria-selected') === 'true');
  },
};

/**
 * Users / Invite users (V2)
 *
 * Tests the user invitation flow from the V2 Users and User Groups page.
 * CRITICAL: Also verifies the correct API URL is called (regression test for /management bug).
 *
 * Journey:
 * 1. Start on V2 Users and User Groups page (Users tab)
 * 2. Click "Invite users" button
 * 3. Fill in email addresses
 * 4. Optionally add a message and check org admin checkbox
 * 5. Submit the invitation
 * 6. Verify success notification
 * 7. Verify API was called with exact expected URL format
 */
export const InviteUsersJourney: Story = {
  name: 'Invite users',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests inviting new users to the organization from the V2 interface.

**What this tests:**
- Navigating to invite users modal from V2 Users tab
- Email input validation (required field)
- Optional message field
- Optional org admin checkbox
- Form submission
- Success notification
- **API URL verification** - ensures the exact URL format is correct (regression test)

**Expected API URL format:**
\`https://api.access.stage.redhat.com/account/v1/accounts/{accountId}/users/invite\`

**NOT:**
\`https://api.access.stage.redhat.com/management/account/v1/accounts/{accountId}/users/invite\`
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    inviteUsersSpyV2.mockClear();
    const canvas = within(context.canvasElement);
    const body = within(document.body);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for the V2 Users tab to load
    await delay(500);

    // Verify we're on the Users tab
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    expect(usersTab).toHaveAttribute('aria-selected', 'true');

    // Wait for users to load
    await waitForPageToLoad(canvas, USER_JOHN.username);

    // Open the Actions overflow menu, then click "Invite users"
    const actionsMenu = await canvas.findByRole('button', { name: /actions overflow menu/i });
    await user.click(actionsMenu);
    await delay(300);

    const inviteMenuItem = await body.findByRole('menuitem', { name: /invite users/i });
    await user.click(inviteMenuItem);
    await delay(500);

    // Modal should open
    await pollUntilTrue(() => !!document.querySelector('[role="dialog"]'));
    const modal = document.querySelector('[role="dialog"]') as HTMLElement;

    const modalContent = within(modal);

    // Wait for modal title (use heading role to avoid conflict with button text)
    await modalContent.findByRole('heading', { name: /invite new users/i });

    // Fill in email addresses (required field)
    const emailInput = await modalContent.findByRole('textbox', { name: /enter the e-mail addresses/i });
    await user.type(emailInput, 'newuser1@example.com, newuser2@example.com');
    await delay(300);

    // Optionally add a message
    const messageInput = await modalContent.findByRole('textbox', { name: /send a message with the invite/i });
    await user.type(messageInput, 'Welcome to our organization!');
    await delay(300);

    // Check the org admin checkbox
    const orgAdminCheckbox = await modalContent.findByRole('checkbox', { name: /organization administrators/i });
    await user.click(orgAdminCheckbox);
    await delay(300);

    // Submit the form
    const submitButton = await modalContent.findByRole('button', { name: /invite new users/i });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);
    await delay(500);

    // Verify success notification
    await verifySuccessNotification();

    // CRITICAL: Verify API was called
    await waitFor(
      () => {
        expect(inviteUsersSpyV2).toHaveBeenCalled();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    // Verify the API call details
    const spyCall = inviteUsersSpyV2.mock.calls[0][0];
    expect(spyCall).toBeDefined();

    // CRITICAL: Verify the URL matches the exact expected format
    // Should be: https://api.access.stage.redhat.com/account/v1/accounts/{accountId}/users/invite
    // Should NOT be: https://api.access.stage.redhat.com/management/account/v1/...
    expect(spyCall.url).toMatch(EXPECTED_INVITE_URL_PATTERN_V2);

    // Verify correct data was sent
    expect(spyCall.emails).toContain('newuser1@example.com');
    expect(spyCall.emails).toContain('newuser2@example.com');

    // Verify org admin role was included (checkbox was checked)
    expect(spyCall.roles).toContain('organization_administrator');
  },
};
