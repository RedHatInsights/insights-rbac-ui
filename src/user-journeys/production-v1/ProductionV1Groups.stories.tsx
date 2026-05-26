import { expect, userEvent, waitFor, within } from 'storybook/test';
import { fillEditGroupModal } from '../../v1/features/groups/EditGroupModal.helpers';
import { fillAddGroupWizardForm } from '../../v1/features/groups/add-group/AddGroupWizard.helpers';
import { fillAddGroupMembersModal } from '../../v1/features/groups/AddGroupMembers.helpers';
import { fillAddGroupRolesModal } from '../../v1/features/groups/AddGroupRoles.helpers';
import { removeSelectedRolesFromGroup } from '../../v1/features/groups/RemoveGroupRoles.helpers';
import { mockRoles, mockServiceAccountsForHandlers, mockUsers } from '../../v1/features/groups/add-group/AddGroupWizard.mocks';
import { createV1MockDb } from '../../v1/data/mocks/db';
import { createV1Handlers } from '../../v1/data/mocks/handlers';
import { clickTab, confirmDestructiveModal, waitForContentReady, waitForModal, waitForNotification } from '../../test-utils/interactionHelpers';
import {
  DEFAULT_GROUPS,
  DEFAULT_USERS,
  GROUP_ENGINEERING,
  GROUP_PLATFORM_ADMINS,
  GROUP_SUPPORT_TEAM,
  Story,
  TEST_TIMEOUTS,
  USER_JANE,
  USER_JOHN,
  V1_ROLE_ADMIN,
  V1_ROLE_VIEWER,
  clickMenuItem,
  meta,
  navigateToPage,
  openDetailPageActionsMenu,
  openRowActionsMenu,
  resetStoryState,
  v1Db,
  verifySuccessNotification,
  waitForPageToLoad,
} from './_v1OrgAdminSetup';
import { DEFAULT_V1_ROLES } from '../../v1/data/mocks/seed';

const createGroupDb = createV1MockDb({
  groups: DEFAULT_GROUPS,
  users: mockUsers,
  roles: mockRoles,
  serviceAccounts: mockServiceAccountsForHandlers,
});
const createGroupHandlers = createV1Handlers(createGroupDb);

const deleteGroupDb = createV1MockDb({
  groups: DEFAULT_GROUPS,
  users: mockUsers,
  roles: mockRoles,
});
const deleteGroupHandlers = createV1Handlers(deleteGroupDb);

const addMembersDb = createV1MockDb({
  groups: DEFAULT_GROUPS,
  users: DEFAULT_USERS,
  roles: DEFAULT_V1_ROLES,
  groupMembers: new Map([['group-2', DEFAULT_USERS.filter((u) => ![USER_JOHN.username, USER_JANE.username].includes(u.username!)).slice(0, 5)]]),
});
const addMembersHandlers = createV1Handlers(addMembersDb);

const removeMembersDb = createV1MockDb({
  groups: DEFAULT_GROUPS,
  users: DEFAULT_USERS,
  roles: DEFAULT_V1_ROLES,
  groupMembers: new Map([['group-1', [DEFAULT_USERS[0], DEFAULT_USERS[1]]]]),
});
const removeMembersHandlers = createV1Handlers(removeMembersDb);

const addRolesDb = createV1MockDb({
  groups: DEFAULT_GROUPS,
  users: DEFAULT_USERS,
  roles: DEFAULT_V1_ROLES,
  groupRoles: new Map([['group-2', []]]),
});
const addRolesHandlers = createV1Handlers(addRolesDb);

const removeRolesDb = createV1MockDb({
  groups: DEFAULT_GROUPS,
  users: DEFAULT_USERS,
  roles: DEFAULT_V1_ROLES,
  groupRoles: new Map([['group-1', [DEFAULT_V1_ROLES[0], DEFAULT_V1_ROLES[1]]]]),
});
const removeRolesHandlers = createV1Handlers(removeRolesDb);

export default { ...meta, title: 'User Journeys/Production/V1 (Current)/Org Admin/Groups', tags: ['prod-org-admin'] };

export const CreateGroupJourney: Story = {
  name: 'Create new group',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    featureFlags: {
      'platform.rbac.group-service-accounts': false,
      'platform.rbac.group-service-accounts.stable': true,
    },
    msw: {
      handlers: createGroupHandlers,
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(createGroupDb);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, GROUP_PLATFORM_ADMINS.name);
    });

    await step('Open create group modal', async () => {
      const createButton = await canvas.findByRole('button', { name: /create group/i });
      await user.click(createButton);
      const modal = await waitForModal();
      await modal.findByRole('textbox', { name: /name/i });
    });

    await step('Fill form and submit', async () => {
      await fillAddGroupWizardForm(
        {
          name: 'DevOps Team',
          description: 'DevOps team with service accounts',
          selectRoles: true,
          selectUsers: true,
          selectServiceAccounts: true,
        },
        undefined,
        false,
        user,
        step,
      );
    });

    await step('Wait for modal to close', async () => {
      await waitFor(() => {
        expect(within(document.body).queryByRole('dialog')).toBeNull();
      });
    });

    await step('Verify success notification and new group', async () => {
      await verifySuccessNotification();
      expect(await canvas.findByText('DevOps Team')).toBeInTheDocument();
    });
  },
};

export const EditGroupFromList: Story = {
  name: 'Edit from list',
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

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
    });

    await step('Verify initial state', async () => {
      // First element after navigation — no waitForPageToLoad preceded it
      await canvas.findByText(GROUP_SUPPORT_TEAM.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      expect(canvas.queryByText('Customer Support Team')).not.toBeInTheDocument();
    });

    await step('Open edit modal from row actions', async () => {
      await openRowActionsMenu(user, canvas, GROUP_SUPPORT_TEAM.name);
      await clickMenuItem(user, 'Edit');
    });

    await step('Fill form and submit', async () => {
      await fillEditGroupModal(
        {
          name: 'Customer Support Team',
          description: 'Updated customer support access team',
        },
        true,
        user,
        step,
      );
    });

    await step('Verify success notification and updated name', async () => {
      await verifySuccessNotification();
      // Content appears after API mutation (edit)
      expect(await canvas.findByText('Customer Support Team', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).toBeInTheDocument();
      expect(canvas.queryByText(GROUP_SUPPORT_TEAM.name)).not.toBeInTheDocument();
    });
  },
};

export const EditGroupFromDetailPage: Story = {
  name: 'Edit from detail page',
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

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, GROUP_SUPPORT_TEAM.name);
    });

    await step('Open group detail page', async () => {
      const groupLink = canvas.getByRole('link', { name: GROUP_SUPPORT_TEAM.name });
      await user.click(groupLink);
      await waitFor(
        async () => {
          await expect(canvas.queryByRole('heading', { name: GROUP_SUPPORT_TEAM.name })).toBeInTheDocument();
          expect(canvas.queryByRole('heading', { name: 'Customer Support Team' })).not.toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Wait for detail page elements', async () => {
      await canvas.findByRole('button', { name: 'Actions' });
      await canvas.findByRole('tab', { name: /members/i });
    });

    await step('Open edit modal from detail page actions', async () => {
      await openDetailPageActionsMenu(user, canvas);
      await clickMenuItem(user, 'Edit');
    });

    await step('Fill form and submit', async () => {
      await fillEditGroupModal(
        {
          name: 'Customer Support Team',
          description: 'Updated customer support access team',
        },
        true,
        user,
        step,
      );
    });

    await step('Verify success notification and updated heading', async () => {
      await Promise.all([
        verifySuccessNotification(),
        waitFor(() => {
          const updatedHeading = canvas.queryByRole('heading', { name: 'Customer Support Team' });
          expect(updatedHeading).toBeInTheDocument();
          expect(canvas.queryByRole('heading', { name: GROUP_SUPPORT_TEAM.name })).not.toBeInTheDocument();
        }),
      ]);
    });
  },
};

export const DeleteGroupFromList: Story = {
  name: 'Delete from list',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: deleteGroupHandlers,
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(deleteGroupDb);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, GROUP_SUPPORT_TEAM.name);
    });

    await step('Open delete modal from row actions', async () => {
      await openRowActionsMenu(user, canvas, GROUP_SUPPORT_TEAM.name);
      await clickMenuItem(user, 'Delete');
      const modal = await waitForModal();
      await modal.findByText(GROUP_SUPPORT_TEAM.name);
    });

    await step('Confirm delete', async () => {
      await confirmDestructiveModal(user, { buttonText: /remove/i });
    });

    await step('Verify success notification and group removed', async () => {
      await verifySuccessNotification();
      await waitFor(
        () => {
          expect(canvas.queryByText(GROUP_SUPPORT_TEAM.name)).toBeNull();
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });
  },
};

export const DeleteGroupFromDetailPage: Story = {
  name: 'Delete from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: deleteGroupHandlers,
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(deleteGroupDb);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, GROUP_SUPPORT_TEAM.name);
    });

    await step('Open group detail page', async () => {
      const groupLink = await canvas.findByRole('link', { name: GROUP_SUPPORT_TEAM.name });
      await user.click(groupLink);
      // First element after route navigation to group detail
      await canvas.findByRole('heading', { name: GROUP_SUPPORT_TEAM.name }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await clickTab(user, canvas, /members/i);
    });

    await step('Delete group from detail page', async () => {
      await openDetailPageActionsMenu(user, canvas);
      await clickMenuItem(user, 'Delete');
      await confirmDestructiveModal(user);
    });

    await step('Verify success notification and redirect', async () => {
      await verifySuccessNotification();
      await waitFor(() => {
        expect(canvas.queryByText(GROUP_PLATFORM_ADMINS.name)).toBeInTheDocument();
        expect(canvas.queryByText(GROUP_ENGINEERING.name)).toBeInTheDocument();
        expect(canvas.queryByText(GROUP_SUPPORT_TEAM.name)).not.toBeInTheDocument();
      });
    });
  },
};

export const AddMembersToGroupJourney: Story = {
  name: 'Add members',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: addMembersHandlers,
    },
    docs: {
      description: {
        story: `
Tests the full flow of adding members to an existing group.

**Journey Flow:**
- Loads group detail page (Support Team)
- Opens "Add member" modal
- Selects users: john.doe, jane.smith
- Confirms addition
- Verifies success notification
- Confirms members appear in list
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(addMembersDb);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, GROUP_SUPPORT_TEAM.name);
    });

    await step('Open group detail page and Members tab', async () => {
      const groupLink = await canvas.findByRole('link', { name: GROUP_SUPPORT_TEAM.name });
      await user.click(groupLink);
      // First element after route navigation to group detail
      await canvas.findByRole('heading', { name: GROUP_SUPPORT_TEAM.name }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await clickTab(user, canvas, /members/i);
    });

    await step('Open add member modal and add users', async () => {
      const addMemberBtn = await canvas.findByRole('button', { name: /add member/i });
      await user.click(addMemberBtn);
      await fillAddGroupMembersModal(user, [USER_JOHN.username, USER_JANE.username], step);
    });

    await step('Verify success notification and members in list', async () => {
      await waitForNotification(/success adding members to group/i);
      // Content appears after API mutation (add members)
      await canvas.findByText(USER_JOHN.username, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await canvas.findByText(USER_JANE.username, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });
  },
};

export const RemoveMembersFromGroupJourney: Story = {
  name: 'Remove members',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: removeMembersHandlers,
    },
    docs: {
      description: {
        story: `
Tests the full flow of removing members from a group.

**Journey Flow:**
- Loads group detail page (Platform Admins)
- Selects a member to remove
- Clicks "Remove (#)" button
- Verifies success notification
- Confirms member is removed from list
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(removeMembersDb);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, GROUP_PLATFORM_ADMINS.name);
    });

    await step('Open group detail page and Members tab', async () => {
      const groupLink = await canvas.findByRole('link', { name: GROUP_PLATFORM_ADMINS.name });
      await user.click(groupLink);
      // First element after route navigation to group detail
      await canvas.findByRole('heading', { name: GROUP_PLATFORM_ADMINS.name }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await clickTab(user, canvas, /members/i);
    });

    await step('Select member and remove', async () => {
      const memberCheckboxes = await canvas.findAllByRole('checkbox');
      await user.click(memberCheckboxes[1]);
      const bulkActionsBtn = await canvas.findByRole('button', { name: 'Member bulk actions' });
      await user.click(bulkActionsBtn);
      const removeMenuItem = await within(document.body).findByRole('menuitem', { name: 'Remove' });
      await user.click(removeMenuItem);
      const modal = await waitForModal();
      const confirmRemoveBtn = await modal.findByRole('button', { name: /remove/i });
      await user.click(confirmRemoveBtn);
    });

    await step('Verify success notification and member removed', async () => {
      await waitForNotification(/success removing members from group/i);
      await canvas.findByText(USER_JANE.username);
      await waitFor(
        () => {
          expect(canvas.queryByText(USER_JOHN.username)).toBeNull();
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });
  },
};

export const AddRolesToGroupJourney: Story = {
  name: 'Add roles',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: addRolesHandlers,
    },
    docs: {
      description: {
        story: `
Tests the full flow of adding roles to an existing group.

**Journey Flow:**
- Loads group detail page (Support Team) - Roles tab
- Opens "Add role" modal
- Selects roles: Administrator, Viewer
- Confirms addition
- Verifies success notification
- Confirms roles appear in list
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(addRolesDb);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, GROUP_SUPPORT_TEAM.name);
    });

    await step('Open group detail page and Roles tab', async () => {
      const groupLink = await canvas.findByRole('link', { name: GROUP_SUPPORT_TEAM.name });
      await user.click(groupLink);
      // First element after route navigation to group detail
      await canvas.findByRole('heading', { name: GROUP_SUPPORT_TEAM.name }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await clickTab(user, canvas, /roles/i);
    });

    await step('Open add role modal and add roles', async () => {
      const addRoleBtnToClick = await canvas.findByRole('button', { name: /add role/i });
      await waitFor(() => expect(addRoleBtnToClick).toBeEnabled());
      await user.click(addRoleBtnToClick);
      await fillAddGroupRolesModal(user, GROUP_SUPPORT_TEAM.name, 2, step);
    });

    await step('Verify success notification and roles in list', async () => {
      await waitForNotification(/success adding roles to group/i);
      // Content appears after API mutation (add roles)
      await canvas.findByText(V1_ROLE_ADMIN.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await canvas.findByText(V1_ROLE_VIEWER.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });
  },
};

export const RemoveRolesFromGroupJourney: Story = {
  name: 'Remove roles',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: removeRolesHandlers,
    },
    docs: {
      description: {
        story: `
Tests the full flow of removing roles from a group.

**Journey Flow:**
- Loads group detail page (Platform Admins) - Roles tab
- Selects a role to remove
- Clicks "Remove selected" button
- Verifies success notification
- Confirms role is removed from list
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(removeRolesDb);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Groups page', async () => {
      await navigateToPage(user, canvas, 'Groups');
      await waitForPageToLoad(canvas, GROUP_PLATFORM_ADMINS.name);
    });

    await step('Open group detail page and Roles tab', async () => {
      const groupLink = await canvas.findByRole('link', { name: GROUP_PLATFORM_ADMINS.name });
      await user.click(groupLink);
      // First element after route navigation to group detail
      await canvas.findByRole('heading', { name: GROUP_PLATFORM_ADMINS.name }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await clickTab(user, canvas, /roles/i);
    });

    await step('Select role and remove', async () => {
      await canvas.findByText(V1_ROLE_ADMIN.name);
      await canvas.findByText(V1_ROLE_VIEWER.name);
      const roleCheckbox = await canvas.findByRole('checkbox', { name: /select row 0/i });
      await user.click(roleCheckbox);
      await removeSelectedRolesFromGroup(user, canvas);
    });

    await step('Verify success notification and role removed', async () => {
      await waitForNotification(/success removing roles from group/i);
      await waitFor(() => {
        expect(canvas.queryByText(V1_ROLE_ADMIN.name)).not.toBeInTheDocument();
        expect(canvas.queryByText(V1_ROLE_VIEWER.name)).toBeInTheDocument();
      });
    });
  },
};
