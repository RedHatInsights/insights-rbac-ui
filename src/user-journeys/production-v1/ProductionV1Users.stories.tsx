import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { type ScopedQueries, clearAndType, waitForContentReady, waitForModal } from '../../test-utils/interactionHelpers';
import type { UserEvent } from '../../test-utils/testUtils';
import { accountManagementHandlers } from '../../shared/data/mocks/accountManagement.handlers';
import { createV1Handlers } from '../../v1/data/mocks/handlers';
import {
  GROUP_PLATFORM_ADMINS,
  Story,
  TEST_TIMEOUTS,
  USER_BOB,
  USER_JOHN,
  clickMenuItem,
  meta,
  navigateToPage,
  resetStoryState,
  v1Db,
  verifySuccessNotification,
  waitForPageToLoad,
} from './_v1OrgAdminSetup';

const inviteUsersSpy = fn();

const EXPECTED_INVITE_URL_PATTERN = /^https:\/\/api\.access\.(stage\.)?redhat\.com\/account\/v1\/accounts\/\d+\/users\/invite$/;

async function navigateToUserDetailPage(user: UserEvent, canvas: ScopedQueries, username: string) {
  await navigateToPage(user, canvas, 'Users');
  await waitForPageToLoad(canvas, username);

  const statusToggles = await canvas.findAllByTestId('user-status-toggle');
  expect(statusToggles.length).toBeGreaterThan(0);

  const usernameLink = await canvas.findByRole('link', { name: username });
  await user.click(usernameLink);

  await waitForPageToLoad(canvas, 'Add user to a group');
}

export default { ...meta, title: 'User Journeys/Production/V1 (Current)/Org Admin/Users', tags: ['prod-org-admin'] };

export const ViewUserDetailPageJourney: Story = {
  name: 'View user detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to user detail page', async () => {
      await navigateToUserDetailPage(user, canvas, USER_JOHN.username);
    });
  },
};

export const AddUserToGroupFromDetailPageJourney: Story = {
  name: 'Add user to group from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to user detail page', async () => {
      await navigateToUserDetailPage(user, canvas, USER_JOHN.username);
    });

    await step('Open add to group modal', async () => {
      const addToGroupButton = await canvas.findByRole('button', { name: /add user to a group/i });
      await user.click(addToGroupButton);
      await waitForModal();
    });

    await step('Select group and save', async () => {
      const modalContent = await waitForModal();
      const groupRow = await modalContent.findByText(GROUP_PLATFORM_ADMINS.name);
      const row = groupRow.closest('tr');
      const groupCheckbox = within(row as HTMLElement).getByRole('checkbox');
      await user.click(groupCheckbox);

      const addButton = await modalContent.findByRole('button', { name: 'Save' });
      await user.click(addButton);
    });

    await step('Verify success notification', async () => {
      await verifySuccessNotification();
    });
  },
};

export const DeactivateUserJourney: Story = {
  name: 'Deactivate user',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for users table', async () => {
      await navigateToPage(user, canvas, 'Users');
      await waitForPageToLoad(canvas, USER_JOHN.username);
    });

    await step('Select user and open deactivate modal', async () => {
      const userCheckbox = await canvas.findByRole('checkbox', { name: 'Select row 0' });
      await user.click(userCheckbox);

      const kebabButton = await canvas.findByRole('button', { name: /kebab dropdown toggle/i });
      await user.click(kebabButton);

      await clickMenuItem(user, 'Deactivate users');
      await waitForModal();
    });

    await step('Confirm deactivation', async () => {
      const modalContent = await waitForModal();
      const confirmCheckbox = await modalContent.findByRole('checkbox', { name: /yes, i confirm that i want to deactivate these users/i });
      await user.click(confirmCheckbox);

      const deactivateButton = await modalContent.findByRole('button', { name: /deactivate user/i });
      await user.click(deactivateButton);
    });

    await step('Verify success notification', async () => {
      await verifySuccessNotification();
    });
  },
};

export const ActivateUserJourney: Story = {
  name: 'Activate user',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for users table', async () => {
      await navigateToPage(user, canvas, 'Users');
      await waitForPageToLoad(canvas, USER_JOHN.username);
    });

    await step('Apply inactive filter', async () => {
      const filterDropdownButtons = canvas.queryAllByRole('button', { name: /username/i });
      const filterDropdownButton = filterDropdownButtons[0] ?? null;
      if (filterDropdownButton) {
        await user.click(filterDropdownButton);
        const statusOption = await within(document.body).findByRole('menuitem', { name: /status/i });
        await user.click(statusOption);
        const statusFilterToggles = canvas.queryAllByRole('button', { name: /filter by status/i });
        const statusFilterToggle = statusFilterToggles[0] ?? null;
        if (statusFilterToggle) {
          await user.click(statusFilterToggle);
          const inactiveMenuItem = await within(document.body).findByRole('menuitem', { name: /inactive/i });
          const inactiveCheckbox = within(inactiveMenuItem).getByRole('checkbox');
          await user.click(inactiveCheckbox);
        }
      }
    });

    await step('Wait for filtered table', async () => {
      await waitForPageToLoad(canvas, USER_BOB.username);
    });

    await step('Select user and open activate modal', async () => {
      const userCheckbox = await canvas.findByRole('checkbox', { name: 'Select row 0' });
      await user.click(userCheckbox);

      const kebabButton = await canvas.findByRole('button', { name: /kebab dropdown toggle/i });
      await user.click(kebabButton);

      await clickMenuItem(user, 'Activate users');
      await waitForModal();
    });

    await step('Confirm activation', async () => {
      const modalContent = await waitForModal();
      const confirmCheckbox = await modalContent.findByRole('checkbox', { name: /yes, i confirm that i want to add these users/i });
      await user.click(confirmCheckbox);

      const activateButton = await modalContent.findByRole('button', { name: /activate user/i });
      await user.click(activateButton);
    });

    await step('Verify success notification', async () => {
      await verifySuccessNotification();
    });
  },
};

export const InviteUsersJourney: Story = {
  name: 'Invite users',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: [
        ...accountManagementHandlers({
          onInvite: (request: Request, body: unknown) => {
            const b = body as { emails?: string[]; roles?: string[] };
            inviteUsersSpy({
              url: request.url,
              emails: b.emails,
              roles: b.roles,
            });
          },
        }),
        ...createV1Handlers(v1Db),
      ],
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
      inviteUsersSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for users table', async () => {
      await navigateToPage(user, canvas, 'Users');
      await waitForPageToLoad(canvas, USER_JOHN.username);
    });

    await step('Open invite modal', async () => {
      const inviteButton = await canvas.findByRole('button', { name: /invite users/i });
      await user.click(inviteButton);
      await waitForModal();
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

    await step('Verify success notification', async () => {
      await verifySuccessNotification();
    });

    await step('Verify invite API called', async () => {
      await waitFor(
        () => {
          expect(inviteUsersSpy).toHaveBeenCalled();
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );

      const spyCall = inviteUsersSpy.mock.calls[0][0];
      expect(spyCall).toBeDefined();
      expect(spyCall.url).toMatch(EXPECTED_INVITE_URL_PATTERN);
      expect(spyCall.emails).toContain('newuser1@example.com');
      expect(spyCall.emails).toContain('newuser2@example.com');
      expect(spyCall.roles).toContain('organization_administrator');
    });
  },
};
