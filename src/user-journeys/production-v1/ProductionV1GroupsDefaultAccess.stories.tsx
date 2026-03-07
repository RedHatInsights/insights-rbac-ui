import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { fillAddGroupRolesModal } from '../../v1/features/groups/AddGroupRoles.helpers';
import { removeSelectedRolesFromGroup } from '../../v1/features/groups/RemoveGroupRoles.helpers';
import { createV1MockDb } from '../../v1/data/mocks/db';
import { createV1Handlers } from '../../v1/data/mocks/handlers';
import {
  DEFAULT_GROUPS,
  DEFAULT_USERS,
  GROUP_ADMIN_DEFAULT,
  GROUP_PLATFORM_ADMINS,
  GROUP_SYSTEM_DEFAULT,
  Story,
  TEST_TIMEOUTS,
  V1_ROLE_ADMIN,
  meta,
  navigateToPage,
  resetStoryState,
  v1Db,
  verifySuccessNotification,
  waitForPageToLoad,
} from './_v1OrgAdminSetup';
import { DEFAULT_V1_ROLES } from '../../v1/data/mocks/seed';

const modifyAlreadyCopiedDb = createV1MockDb({
  groups: [
    ...DEFAULT_GROUPS.filter((g) => g.uuid !== 'system-default'),
    {
      uuid: 'system-default',
      name: 'Custom default access',
      description: 'Modified platform default group',
      platform_default: true,
      admin_default: false,
      system: false,
      created: '2024-01-15T10:30:00Z',
      modified: '2024-01-16T14:20:00Z',
      principalCount: 5,
      roleCount: 3,
    },
  ],
  users: DEFAULT_USERS,
  roles: DEFAULT_V1_ROLES,
  groupRoles: new Map([['system-default', [DEFAULT_V1_ROLES[0], DEFAULT_V1_ROLES[1], DEFAULT_V1_ROLES[2]]]]),
});
const modifyAlreadyCopiedHandlers = createV1Handlers(modifyAlreadyCopiedDb);

const removeRolesFromCopiedDb = createV1MockDb({
  groups: [
    ...DEFAULT_GROUPS.filter((g) => g.uuid !== 'system-default'),
    {
      uuid: 'system-default',
      name: 'Custom default access',
      description: 'Modified platform default group',
      platform_default: true,
      admin_default: false,
      system: false,
      created: '2024-01-15T10:30:00Z',
      modified: '2024-01-16T14:20:00Z',
      principalCount: 5,
      roleCount: 2,
    },
  ],
  users: DEFAULT_USERS,
  roles: DEFAULT_V1_ROLES,
  groupRoles: new Map([['system-default', [DEFAULT_V1_ROLES[0], DEFAULT_V1_ROLES[1]]]]),
});
const removeRolesFromCopiedHandlers = createV1Handlers(removeRolesFromCopiedDb);

const restoreDefaultGroupDb = createV1MockDb({
  groups: [
    ...DEFAULT_GROUPS.filter((g) => g.uuid !== 'system-default'),
    {
      uuid: 'system-default',
      name: 'Custom default access',
      description: 'Modified platform default group',
      principalCount: 10,
      roleCount: 3,
      created: '2023-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
      platform_default: true,
      admin_default: false,
      system: false,
    },
  ],
  users: DEFAULT_USERS,
  roles: DEFAULT_V1_ROLES,
});
const restoreDefaultGroupBaseHandlers = createV1Handlers(restoreDefaultGroupDb);

export default { ...meta, title: 'User Journeys/Production/V1 (Current)/Org Admin/Groups / Default Access', tags: ['prod-org-admin'] };

export const CopyDefaultGroupAddRolesJourney: Story = {
  name: 'Copy default group (add roles)',
  tags: ['copy-default-group'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the full flow of copying "Default access" group when adding a role for the first time.

**Journey Flow:**
- Navigate to "Default access" group detail page
- Open "Add role" modal
- Select a role
- Click "Add to Group"
- **Confirmation modal appears** warning about copying
- Check confirmation checkbox
- Click "Continue"
- Verify group becomes "Custom default access"
- Verify alert shows on detail page
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState(v1Db);

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, GROUP_SYSTEM_DEFAULT.name);

    const groupLink = canvas.getByRole('link', { name: GROUP_SYSTEM_DEFAULT.name });
    await user.click(groupLink);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: GROUP_SYSTEM_DEFAULT.name })).toBeInTheDocument();
    });

    const rolesTab = canvas.getByRole('tab', { name: /roles/i });
    await user.click(rolesTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    const addRoleBtn = await waitFor(
      () => {
        const btn = canvas.getByRole('button', { name: /add role/i });
        expect(btn).toBeEnabled();
        return btn;
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );
    await user.click(addRoleBtn);

    await fillAddGroupRolesModal(user, GROUP_SYSTEM_DEFAULT.name, 1);

    let warningModal: HTMLElement | null = null;
    await waitFor(
      () => {
        const modalContainer = document.getElementById('storybook-modals') || document.body;
        const allDialogs = Array.from(modalContainer.querySelectorAll('[role="dialog"]'));
        warningModal = (allDialogs.find((dialog) => dialog.getAttribute('data-ouia-component-id') === 'WarningModal') as HTMLElement) || null;
        expect(warningModal).not.toBeNull();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    const modalContent = within(warningModal!);

    const confirmCheckbox = await waitFor(
      () => {
        const checkbox = modalContent.getByLabelText(/I understand, and I want to continue/i);
        expect(checkbox).toBeInTheDocument();
        return checkbox;
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    await user.click(confirmCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const continueButton = await waitFor(
      () => {
        const modalContainer = document.getElementById('storybook-modals') || document.body;
        const button = modalContainer.querySelector('[data-ouia-component-id="WarningModal-confirm-button"]') as HTMLElement;
        expect(button).toBeInTheDocument();
        expect(button).toBeEnabled();
        return button;
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    await user.click(continueButton);

    await waitFor(() => {
      const modalContainer = document.getElementById('storybook-modals') || document.body;
      const warningModals = modalContainer.querySelectorAll('[data-ouia-component-id="WarningModal"]');
      expect(warningModals.length).toBe(0);
    });

    await waitFor(() => {
      expect(canvas.getByRole('heading', { name: /Custom default access/i })).toBeInTheDocument();
    });

    await waitFor(() => {
      const alert = canvas.getByText(/Default access group has changed/i);
      expect(alert).toBeInTheDocument();
    });

    const breadcrumbs = canvas.getByLabelText('Breadcrumb');
    const groupsBreadcrumb = within(breadcrumbs).getByRole('link', { name: 'Groups' });
    await user.click(groupsBreadcrumb);

    await waitForPageToLoad(canvas, GROUP_PLATFORM_ADMINS.name);

    const regularGroupLink = canvas.getByRole('link', { name: GROUP_PLATFORM_ADMINS.name });
    await user.click(regularGroupLink);

    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: /Platform Admins/i })).toBeInTheDocument();
    });

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    const alertOnRegularGroup = canvas.queryByText(/Default access group has changed/i);
    expect(alertOnRegularGroup).not.toBeInTheDocument();
  },
};

export const ModifyAlreadyCopiedGroupJourney: Story = {
  name: 'Modify already-copied default group (no confirmation)',
  tags: ['copy-default-group'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: modifyAlreadyCopiedHandlers,
    },
    docs: {
      description: {
        story: `
Tests that modifying an already-copied "Custom default access" group does NOT show the confirmation modal.

**Journey Flow:**
- Navigate to "Custom default access" group (already copied)
- Open "Add role" modal
- Select a role
- Click "Add to Group"
- **NO confirmation modal** (direct submission)
- Verify success
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState(modifyAlreadyCopiedDb);

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, 'Custom default access');

    const groupLink = canvas.getByRole('link', { name: 'Custom default access' });
    await user.click(groupLink);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: /Custom default access/i })).toBeInTheDocument();
    });

    const rolesTab = canvas.getByRole('tab', { name: /roles/i });
    await user.click(rolesTab);

    const addRoleBtn = await waitFor(
      () => {
        const btn = canvas.getByRole('button', { name: /add role/i });
        expect(btn).toBeEnabled();
        return btn;
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );
    await user.click(addRoleBtn);

    await fillAddGroupRolesModal(user, 'Custom default access', 1);

    await verifySuccessNotification();

    const modalContainer = document.getElementById('storybook-modals') || document.body;
    const wModal = modalContainer.querySelector('[data-ouia-component-id="WarningModal"]');
    expect(wModal).toBeNull();

    await waitFor(async () => {
      const alert = canvas.queryByText(/Default access group has changed/i);
      await expect(alert).toBeInTheDocument();
    });
  },
};

export const RemoveRolesFromCopiedDefaultGroupJourney: Story = {
  name: 'Remove roles from already-copied default group (no confirmation)',
  tags: ['copy-default-group'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: removeRolesFromCopiedHandlers,
    },
    docs: {
      description: {
        story: `
Tests that REMOVING roles from an already-copied "Custom default access" group does NOT show the confirmation modal.

**Why this test matters:**
- The \`isChanged\` flag should be derived as: \`(platform_default || admin_default) && !system\`
- For \`system: false\` (already-modified), \`isChanged = true\`, so NO confirmation modal should appear
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState(removeRolesFromCopiedDb);

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, 'Custom default access');

    const groupLink = canvas.getByRole('link', { name: 'Custom default access' });
    await user.click(groupLink);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: /Custom default access/i })).toBeInTheDocument();
    });

    const rolesTab = canvas.getByRole('tab', { name: /roles/i });
    await user.click(rolesTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(async () => {
      await expect(canvas.getByText(V1_ROLE_ADMIN.name)).toBeInTheDocument();
    });

    const roleCheckbox = canvas.getByRole('checkbox', { name: /select row 0/i });
    await user.click(roleCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await removeSelectedRolesFromGroup(user, canvas, false);

    const warningModal = await within(document.body).findByRole('dialog', {}, { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT });
    expect(warningModal).toBeInTheDocument();

    const confirmationCheckbox = within(warningModal).queryByRole('checkbox');
    expect(confirmationCheckbox).toBeNull();

    const confirmButton = within(warningModal).getByRole('button', { name: /remove/i });
    await user.click(confirmButton);

    await verifySuccessNotification();
  },
};

export const RestoreDefaultGroupJourney: Story = {
  name: 'Restore default group',
  tags: ['copy-default-group'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: (() => {
        let isRestored = false;

        const restoredGroup = {
          uuid: GROUP_SYSTEM_DEFAULT.uuid,
          name: GROUP_SYSTEM_DEFAULT.name,
          description: 'Default platform group',
          principalCount: 'All users',
          roleCount: 0,
          created: '2023-01-01T00:00:00Z',
          modified: '2024-01-01T00:00:00Z',
          platform_default: true,
          admin_default: false,
          system: true,
        };

        return [
          http.get('/api/rbac/v1/groups/system-default/', () => {
            return HttpResponse.json(
              isRestored
                ? restoredGroup
                : {
                    uuid: 'system-default',
                    name: 'Custom default access',
                    description: 'Modified platform default group',
                    principalCount: 10,
                    roleCount: 3,
                    created: '2023-01-01T00:00:00Z',
                    modified: '2024-01-01T00:00:00Z',
                    platform_default: true,
                    admin_default: false,
                    system: false,
                  },
            );
          }),
          http.get('/api/rbac/v1/groups/', ({ request }) => {
            const url = new URL(request.url);
            const platformDefault = url.searchParams.get('platform_default');

            if (platformDefault === 'true' && isRestored) {
              return HttpResponse.json({
                data: [restoredGroup],
                meta: { count: 1, limit: 1, offset: 0 },
              });
            }

            return;
          }),
          http.delete('/api/rbac/v1/groups/', async ({ request }) => {
            const url = new URL(request.url);
            const uuids = url.searchParams.get('uuids')?.split(',') || [];

            if (uuids.includes('system-default')) {
              isRestored = true;
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            return HttpResponse.json({ message: 'Groups deleted successfully' });
          }),
          http.delete('/api/rbac/v1/groups/:groupId/', async ({ params }) => {
            const { groupId } = params;

            if (groupId === 'system-default') {
              isRestored = true;
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
            return new HttpResponse(null, { status: 204 });
          }),
          ...restoreDefaultGroupBaseHandlers,
        ];
      })(),
    },
    docs: {
      description: {
        story: `
Tests the "Restore to default" functionality that allows admins to revert a modified
default group back to its original system-managed state.

**Journey Flow:**
- Navigate to "Custom default access" group (modified default)
- Click "Restore to default" link in header
- Confirm restoration in warning modal
- Verify group is restored to "Default access"
- Verify alert no longer shows
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState(restoreDefaultGroupDb);

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, 'Custom default access');

    const groupLink = canvas.getByRole('link', { name: 'Custom default access' });
    await user.click(groupLink);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: /Custom default access/i })).toBeInTheDocument();
    });

    const restoreLink = await waitFor(
      () => {
        const link = canvas.getByRole('button', { name: /restore to default/i });
        expect(link).toBeInTheDocument();
        return link;
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    await user.click(restoreLink);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    let restoreWarningModal: HTMLElement | null = null;
    await waitFor(
      () => {
        const modalContainer = document.getElementById('storybook-modals') || document.body;
        const allDialogs = Array.from(modalContainer.querySelectorAll('[role="dialog"]'));
        restoreWarningModal =
          (allDialogs.find((dialog) => {
            const dialogContent = dialog.textContent || '';
            return dialogContent.includes('Restore Default access group');
          }) as HTMLElement) || null;
        expect(restoreWarningModal).not.toBeNull();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    const modalContent = within(restoreWarningModal!);
    expect(modalContent.getByText(/Restore Default access group/i)).toBeInTheDocument();
    expect(restoreWarningModal!.textContent).toContain('Restoring Default access group');
    expect(restoreWarningModal!.textContent).toContain('Custom default access group');

    const continueButton = await waitFor(
      () => {
        const btn = modalContent.getByRole('button', { name: /continue/i });
        expect(btn).toBeInTheDocument();
        expect(btn).toBeEnabled();
        return btn;
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    await user.click(continueButton);

    await waitFor(() => {
      const modalContainer = document.getElementById('storybook-modals') || document.body;
      const restoreModals = modalContainer.querySelectorAll('[role="dialog"]');
      expect(restoreModals.length).toBe(0);
    });

    await waitFor(() => {
      const heading = canvas.queryByRole('heading', { name: /^Default access$/i });
      expect(heading).toBeInTheDocument();
    });

    await waitFor(() => {
      const restoreLinkAfter = canvas.queryByRole('button', { name: /restore to default/i });
      expect(restoreLinkAfter).not.toBeInTheDocument();
    });

    const alert = canvas.queryByText(/Default access group has changed/i);
    expect(alert).not.toBeInTheDocument();
  },
};

export const DefaultAdminAccessMembersJourney: Story = {
  name: 'Default Admin Access Members Tab',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that the "Default admin access" group Members tab shows the special card
instead of a table, with the message about all org admins being members.
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState(v1Db);

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, GROUP_ADMIN_DEFAULT.name);

    const groupLink = canvas.getByRole('link', { name: GROUP_ADMIN_DEFAULT.name });
    await user.click(groupLink);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(() => {
      expect(canvas.getByRole('heading', { name: /Default admin access/i })).toBeInTheDocument();
    });

    const membersTab = canvas.getByRole('tab', { name: /members/i });
    await user.click(membersTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(() => {
      expect(canvas.getByText(/All organization administrators in this organization are members of this group/i)).toBeInTheDocument();
    });

    const table = canvas.queryByRole('table');
    expect(table).not.toBeInTheDocument();
  },
};

export const DefaultAccessMembersJourney: Story = {
  name: 'Default Access Members Tab',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that the "Default access" group Members tab shows the special card
message about all users being members (not admin-specific message).
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState(v1Db);

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, GROUP_SYSTEM_DEFAULT.name);

    const groupLink = canvas.getByRole('link', { name: GROUP_SYSTEM_DEFAULT.name });
    await user.click(groupLink);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(() => {
      expect(canvas.getByRole('heading', { name: /^Default access$/i })).toBeInTheDocument();
    });

    const membersTab = canvas.getByRole('tab', { name: /members/i });
    await user.click(membersTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(() => {
      expect(canvas.getByText(/all users in this organization are members of this group/i)).toBeInTheDocument();
    });

    const table = canvas.queryByRole('table');
    expect(table).not.toBeInTheDocument();

    const adminMessage = canvas.queryByText(/All organization administrators in this organization are members of this group/i);
    expect(adminMessage).not.toBeInTheDocument();
  },
};

export const DefaultAdminAccessServiceAccountsJourney: Story = {
  name: 'Default Admin Access Service Accounts Tab',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that the "Default admin access" group Service Accounts tab shows the special
message about service accounts not being automatically included for security reasons.
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState(v1Db);

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, GROUP_ADMIN_DEFAULT.name);

    const groupLink = canvas.getByRole('link', { name: GROUP_ADMIN_DEFAULT.name });
    await user.click(groupLink);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(() => {
      expect(canvas.getByRole('heading', { name: /Default admin access/i })).toBeInTheDocument();
    });

    const serviceAccountsTab = canvas.getByRole('tab', { name: /service accounts/i });
    await user.click(serviceAccountsTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(() => {
      expect(
        canvas.getByText(/In adherence to security guidelines, service accounts are not automatically included in the default admin access group/i),
      ).toBeInTheDocument();
    });

    const table = canvas.queryByRole('table');
    expect(table).not.toBeInTheDocument();
  },
};

export const DefaultAccessServiceAccountsJourney: Story = {
  name: 'Default Access Service Accounts Tab',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests that the "Default access" group Service Accounts tab shows the special
message about service accounts not being automatically included for security reasons.
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState(v1Db);

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, GROUP_SYSTEM_DEFAULT.name);

    const groupLink = canvas.getByRole('link', { name: GROUP_SYSTEM_DEFAULT.name });
    await user.click(groupLink);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(() => {
      expect(canvas.getByRole('heading', { name: /^Default access$/i })).toBeInTheDocument();
    });

    const serviceAccountsTab = canvas.getByRole('tab', { name: /service accounts/i });
    await user.click(serviceAccountsTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(() => {
      expect(
        canvas.getByText(/In adherence to security guidelines, service accounts are not automatically included in the default access group/i),
      ).toBeInTheDocument();
    });

    const table = canvas.queryByRole('table');
    expect(table).not.toBeInTheDocument();
  },
};
