import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, http } from 'msw';
import { fillAddGroupRolesModal } from '../../v1/features/groups/AddGroupRoles.helpers';
import { removeSelectedRolesFromGroup } from '../../v1/features/groups/RemoveGroupRoles.helpers';
import { createV1MockDb } from '../../v1/data/mocks/db';
import { createV1Handlers } from '../../v1/data/mocks/handlers';
import { clickTab, confirmDestructiveModal, waitForContentReady, waitForModal } from '../../test-utils/interactionHelpers';
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, GROUP_SYSTEM_DEFAULT.name);
    });

    await step('Open default access group detail page', async () => {
      const groupLink = await canvas.findByRole('link', { name: GROUP_SYSTEM_DEFAULT.name });
      await user.click(groupLink);
      await canvas.findByRole('heading', { name: GROUP_SYSTEM_DEFAULT.name });
      await clickTab(user, canvas, /roles/i);
    });

    await step('Open add role modal and add role', async () => {
      const addRoleBtn = await canvas.findByRole('button', { name: /add role/i }, { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT });
      await waitFor(() => expect(addRoleBtn).toBeEnabled());
      await user.click(addRoleBtn);
      await fillAddGroupRolesModal(user, GROUP_SYSTEM_DEFAULT.name, 1, step);
    });

    await step('Confirm copy in modal', async () => {
      await confirmDestructiveModal(user, { buttonText: /continue/i });
      await waitFor(() => {
        expect(within(document.body).queryByRole('dialog')).toBeNull();
      });
    });

    await step('Verify group becomes Custom default access', async () => {
      // Content appears after API mutation (copy default group)
      await canvas.findByRole('heading', { name: /Custom default access/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await canvas.findByText(/Default access group has changed/i);
    });

    await step('Navigate to regular group and verify no alert', async () => {
      const breadcrumbs = await canvas.findByLabelText('Breadcrumb');
      const groupsBreadcrumb = within(breadcrumbs).getByRole('link', { name: 'Groups' });
      await user.click(groupsBreadcrumb);
      await waitForPageToLoad(canvas, GROUP_PLATFORM_ADMINS.name);
      const regularGroupLink = await canvas.findByRole('link', { name: GROUP_PLATFORM_ADMINS.name });
      await user.click(regularGroupLink);
      await canvas.findByRole('heading', { name: /Platform Admins/i });
      const alertOnRegularGroup = canvas.queryByText(/Default access group has changed/i);
      expect(alertOnRegularGroup).not.toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(modifyAlreadyCopiedDb);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, 'Custom default access');
    });

    await step('Open Custom default access group detail page', async () => {
      const groupLink = await canvas.findByRole('link', { name: 'Custom default access' });
      await user.click(groupLink);
      await canvas.findByRole('heading', { name: /Custom default access/i });
      await clickTab(user, canvas, /roles/i);
    });

    await step('Add role without confirmation modal', async () => {
      const addRoleBtn = await canvas.findByRole('button', { name: /add role/i }, { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT });
      await waitFor(() => expect(addRoleBtn).toBeEnabled());
      await user.click(addRoleBtn);
      await fillAddGroupRolesModal(user, 'Custom default access', 1, step);
    });

    await step('Verify success and alert', async () => {
      await verifySuccessNotification();
      await waitFor(() => {
        expect(within(document.body).queryByRole('dialog')).toBeNull();
      });
      await canvas.findByText(/Default access group has changed/i);
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(removeRolesFromCopiedDb);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, 'Custom default access');
    });

    await step('Open Custom default access group and Roles tab', async () => {
      const groupLink = await canvas.findByRole('link', { name: 'Custom default access' });
      await user.click(groupLink);
      await canvas.findByRole('heading', { name: /Custom default access/i });
      await clickTab(user, canvas, /roles/i);
    });

    await step('Select role and remove', async () => {
      await canvas.findByText(V1_ROLE_ADMIN.name);
      const roleCheckbox = await canvas.findByRole('checkbox', { name: /select row 0/i });
      await user.click(roleCheckbox);
      await removeSelectedRolesFromGroup(user, canvas, false);
      await confirmDestructiveModal(user, { buttonText: /remove/i });
    });

    await step('Verify success notification', async () => {
      await verifySuccessNotification();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(restoreDefaultGroupDb);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, 'Custom default access');
    });

    await step('Open Custom default access group detail page', async () => {
      const groupLink = await canvas.findByRole('link', { name: 'Custom default access' });
      await user.click(groupLink);
      await canvas.findByRole('heading', { name: /Custom default access/i });
    });

    await step('Click restore to default', async () => {
      const restoreLink = await canvas.findByRole('button', { name: /restore to default/i }, { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT });
      await user.click(restoreLink);
      const modal = await waitForModal();
      await modal.findByText(/Restore Default access group/i);
      await modal.findByText(/Restoring/i);
    });

    await step('Confirm restore', async () => {
      await confirmDestructiveModal(user, { buttonText: /continue/i });
      await waitFor(() => {
        expect(within(document.body).queryByRole('dialog')).toBeNull();
      });
    });

    await step('Verify group restored and no alert', async () => {
      // Content appears after API mutation (restore)
      await canvas.findByRole('heading', { name: /^Default access$/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      expect(canvas.queryByRole('button', { name: /restore to default/i })).not.toBeInTheDocument();
      const alert = canvas.queryByText(/Default access group has changed/i);
      expect(alert).not.toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, GROUP_ADMIN_DEFAULT.name);
    });

    await step('Open Default admin access group and Members tab', async () => {
      const groupLink = await canvas.findByRole('link', { name: GROUP_ADMIN_DEFAULT.name });
      await user.click(groupLink);
      await canvas.findByRole('heading', { name: /Default admin access/i });
      await clickTab(user, canvas, /members/i);
    });

    await step('Verify special card and no table', async () => {
      await canvas.findByText(/All organization administrators in this organization are members of this group/i);
      const table = canvas.queryByRole('table');
      expect(table).not.toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, GROUP_SYSTEM_DEFAULT.name);
    });

    await step('Open Default access group and Members tab', async () => {
      const groupLink = await canvas.findByRole('link', { name: GROUP_SYSTEM_DEFAULT.name });
      await user.click(groupLink);
      await canvas.findByRole('heading', { name: /^Default access$/i });
      await clickTab(user, canvas, /members/i);
    });

    await step('Verify special card and no table', async () => {
      await canvas.findByText(/all users in this organization are members of this group/i);
      const table = canvas.queryByRole('table');
      expect(table).not.toBeInTheDocument();
      const adminMessage = canvas.queryByText(/All organization administrators in this organization are members of this group/i);
      expect(adminMessage).not.toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, GROUP_ADMIN_DEFAULT.name);
    });

    await step('Open Default admin access group and Service Accounts tab', async () => {
      const groupLink = await canvas.findByRole('link', { name: GROUP_ADMIN_DEFAULT.name });
      await user.click(groupLink);
      await canvas.findByRole('heading', { name: /Default admin access/i });
      await clickTab(user, canvas, /service accounts/i);
    });

    await step('Verify special message and no table', async () => {
      await canvas.findByText(
        /In adherence to security guidelines, service accounts are not automatically included in the default admin access group/i,
      );
      const table = canvas.queryByRole('table');
      expect(table).not.toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, GROUP_SYSTEM_DEFAULT.name);
    });

    await step('Open Default access group and Service Accounts tab', async () => {
      const groupLink = await canvas.findByRole('link', { name: GROUP_SYSTEM_DEFAULT.name });
      await user.click(groupLink);
      await canvas.findByRole('heading', { name: /^Default access$/i });
      await clickTab(user, canvas, /service accounts/i);
    });

    await step('Verify special message and no table', async () => {
      await canvas.findByText(/In adherence to security guidelines, service accounts are not automatically included in the default access group/i);
      const table = canvas.queryByRole('table');
      expect(table).not.toBeInTheDocument();
    });
  },
};
