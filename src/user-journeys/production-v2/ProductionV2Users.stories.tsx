import { expect, userEvent, waitFor, within } from 'storybook/test';
import { clearAndType, waitForContentReady } from '../../test-utils/interactionHelpers';
import {
  Story,
  TEST_TIMEOUTS,
  USER_JOHN,
  db,
  inviteUsersSpyV2,
  meta,
  resetStoryState,
  verifySuccessNotification,
  waitForModal,
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify Users tab active', async () => {
      const usersTab = await canvas.findByRole('tab', { name: /users/i });
      await waitFor(() => expect(usersTab).toHaveAttribute('aria-selected', 'true'));
    });

    await step('Switch to User Groups tab', async () => {
      const groupsTab = await canvas.findByRole('tab', { name: /user groups/i });
      await user.click(groupsTab);
      await waitFor(() => expect(groupsTab).toHaveAttribute('aria-selected', 'true'));
    });

    await step('Switch back to Users tab', async () => {
      const usersTab = await canvas.findByRole('tab', { name: /users/i });
      await user.click(usersTab);
      await waitFor(() => expect(usersTab).toHaveAttribute('aria-selected', 'true'));
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
      inviteUsersSpyV2.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Open Invite users modal', async () => {
      const usersTab = await canvas.findByRole('tab', { name: /users/i });
      expect(usersTab).toHaveAttribute('aria-selected', 'true');

      await waitForPageToLoad(canvas, USER_JOHN.username);

      const actionsMenu = await canvas.findByRole('button', { name: /actions overflow menu/i });
      await user.click(actionsMenu);

      const inviteMenuItem = await body.findByRole('menuitem', { name: /invite users/i });
      await user.click(inviteMenuItem);

      const modalContent = await waitForModal();
      await modalContent.findByRole('heading', { name: /invite new users/i });
    });

    await step('Wait for invite modal', async () => {
      await waitForModal({
        timeout: TEST_TIMEOUTS.POST_MUTATION_REFRESH,
        waitUntil: (dlg) => {
          expect(dlg.queryByRole('textbox', { name: /enter the e-mail addresses/i })).toBeInTheDocument();
          expect(dlg.queryByRole('textbox', { name: /send a message with the invite/i })).toBeInTheDocument();
        },
      });
    });

    await step('Fill email addresses', async () => {
      const modal = await waitForModal();
      await clearAndType(
        user,
        () => modal.getByRole('textbox', { name: /enter the e-mail addresses/i }) as HTMLInputElement,
        'newuser1@example.com, newuser2@example.com',
      );
    });

    await step('Fill message', async () => {
      const modal = await waitForModal();
      await clearAndType(
        user,
        () => modal.getByRole('textbox', { name: /send a message with the invite/i }) as HTMLTextAreaElement,
        'Welcome to our organization!',
      );
    });

    await step('Check org admin and submit', async () => {
      const modal = await waitForModal();
      await waitFor(() => {
        expect(modal.queryByRole('checkbox', { name: /organization administrators/i })).toBeInTheDocument();
      });
      const orgAdminCheckbox = modal.getByRole('checkbox', { name: /organization administrators/i });
      await user.click(orgAdminCheckbox);
      const submitButton = await modal.findByRole('button', { name: /invite new users/i });
      await waitFor(() => expect(submitButton).toBeEnabled());
      await user.click(submitButton);
    });

    await step('Verify success notification and API spy', async () => {
      await verifySuccessNotification();

      await waitFor(
        () => {
          expect(inviteUsersSpyV2).toHaveBeenCalled();
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );

      const spyCall = inviteUsersSpyV2.mock.calls[0][0];
      expect(spyCall).toBeDefined();

      expect(spyCall.url).toMatch(EXPECTED_INVITE_URL_PATTERN_V2);

      expect(spyCall.emails).toContain('newuser1@example.com');
      expect(spyCall.emails).toContain('newuser2@example.com');

      expect(spyCall.roles).toContain('organization_administrator');
    });
  },
};
