import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
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

async function navigateToUserDetailPage(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>, username: string) {
  await navigateToPage(user, canvas, 'Users');
  await waitForPageToLoad(canvas, username);

  const statusToggles = canvas.getAllByTestId('user-status-toggle');
  expect(statusToggles.length).toBeGreaterThan(0);

  const usernameLink = canvas.getByRole('link', { name: username });
  await user.click(usernameLink);
  await delay(TEST_TIMEOUTS.AFTER_EXPAND);

  await waitForPageToLoad(canvas, 'Add user to a group');
}

export default { ...meta, title: 'User Journeys/Production/V1 (Current)/Org Admin/Users', tags: ['prod-org-admin'] };

export const ViewUserDetailPageJourney: Story = {
  name: 'View user detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToUserDetailPage(user, canvas, USER_JOHN.username);
  },
};

export const AddUserToGroupFromDetailPageJourney: Story = {
  name: 'Add user to group from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToUserDetailPage(user, canvas, USER_JOHN.username);

    const addToGroupButton = await canvas.findByRole('button', { name: /add user to a group/i });
    await user.click(addToGroupButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    const modal = await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      return dialog as HTMLElement;
    });

    const modalContent = within(modal);

    const groupRow = await modalContent.findByText(GROUP_PLATFORM_ADMINS.name);
    const row = groupRow.closest('tr');
    const groupCheckbox = within(row as HTMLElement).getByRole('checkbox');
    await user.click(groupCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const addButton = modalContent.getByRole('button', { name: 'Save' });
    await user.click(addButton);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await verifySuccessNotification();
  },
};

export const DeactivateUserJourney: Story = {
  name: 'Deactivate user',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Users');
    await waitForPageToLoad(canvas, USER_JOHN.username);

    const userCheckbox = canvas.getByRole('checkbox', { name: 'Select row 0' });
    await user.click(userCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const kebabButton = canvas.getByRole('button', { name: /kebab dropdown toggle/i });
    await user.click(kebabButton);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await clickMenuItem(user, 'Deactivate users');
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    const modal = await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      return dialog as HTMLElement;
    });

    const modalContent = within(modal);

    const confirmCheckbox = modalContent.getByRole('checkbox', { name: /yes, i confirm that i want to deactivate these users/i });
    await user.click(confirmCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const deactivateButton = modalContent.getByRole('button', { name: /deactivate user/i });
    await user.click(deactivateButton);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await verifySuccessNotification();
  },
};

export const ActivateUserJourney: Story = {
  name: 'Activate user',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Users');
    await waitForPageToLoad(canvas, USER_JOHN.username);

    const filterContainer = context.canvasElement.querySelector('[data-ouia-component-id="DataViewFilters"]');
    if (filterContainer) {
      const filterCanvas = within(filterContainer as HTMLElement);
      const filterTypeButtons = filterCanvas.getAllByRole('button');
      const filterDropdownButton = filterTypeButtons.find((btn) => btn.textContent?.toLowerCase().includes('username'));
      if (filterDropdownButton) {
        await user.click(filterDropdownButton);
        const statusOption = await within(document.body).findByRole('menuitem', { name: /status/i });
        await user.click(statusOption);
        await delay(TEST_TIMEOUTS.AFTER_CLICK);
        const statusFilterToggle = context.canvasElement.querySelector('[data-ouia-component-id="DataViewCheckboxFilter-toggle"]') as HTMLElement;
        if (statusFilterToggle) {
          await user.click(statusFilterToggle);
          const inactiveMenuItem = await within(document.body).findByRole('menuitem', { name: /inactive/i });
          const inactiveCheckbox = within(inactiveMenuItem).getByRole('checkbox');
          await user.click(inactiveCheckbox);
          await delay(TEST_TIMEOUTS.AFTER_CLICK);
        }
      }
    }

    await waitForPageToLoad(canvas, USER_BOB.username);

    const userCheckbox = await canvas.findByRole('checkbox', { name: 'Select row 0' });
    await user.click(userCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    const kebabButton = canvas.getByRole('button', { name: /kebab dropdown toggle/i });
    await user.click(kebabButton);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await clickMenuItem(user, 'Activate users');
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    const modal = await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      return dialog as HTMLElement;
    });

    const modalContent = within(modal);

    const confirmCheckbox = modalContent.getByRole('checkbox', { name: /yes, i confirm that i want to add these users/i });
    await user.click(confirmCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const activateButton = modalContent.getByRole('button', { name: /activate user/i });
    await user.click(activateButton);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await verifySuccessNotification();
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
  play: async (context) => {
    await resetStoryState(v1Db);
    inviteUsersSpy.mockClear();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Users');
    await waitForPageToLoad(canvas, USER_JOHN.username);

    const inviteButton = canvas.getByRole('button', { name: /invite users/i });
    await user.click(inviteButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    const modal = await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      return dialog as HTMLElement;
    });

    const modalContent = within(modal);

    await modalContent.findByRole('heading', { name: /invite new users/i });

    const emailInput = modalContent.getByRole('textbox', { name: /enter the e-mail addresses/i });
    await user.type(emailInput, 'newuser1@example.com, newuser2@example.com');
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const messageInput = modalContent.getByRole('textbox', { name: /send a message with the invite/i });
    await user.type(messageInput, 'Welcome to our organization!');
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const orgAdminCheckbox = modalContent.getByRole('checkbox', { name: /organization administrators/i });
    await user.click(orgAdminCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const submitButton = modalContent.getByRole('button', { name: /invite new users/i });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await verifySuccessNotification();

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
  },
};
