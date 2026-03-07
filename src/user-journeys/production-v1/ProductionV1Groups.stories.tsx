import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
import { fillEditGroupModal } from '../../v1/features/groups/EditGroupModal.helpers';
import { fillAddGroupWizardForm } from '../../v1/features/groups/add-group/AddGroupWizard.helpers';
import { fillAddGroupMembersModal } from '../../v1/features/groups/AddGroupMembers.helpers';
import { fillAddGroupRolesModal } from '../../v1/features/groups/AddGroupRoles.helpers';
import { removeSelectedRolesFromGroup } from '../../v1/features/groups/RemoveGroupRoles.helpers';
import { mockRoles, mockServiceAccountsForHandlers, mockUsers } from '../../v1/features/groups/add-group/AddGroupWizard.mocks';
import { createV1MockDb } from '../../v1/data/mocks/db';
import { createV1Handlers } from '../../v1/data/mocks/handlers';
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
  confirmDeleteModal,
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
  play: async (context) => {
    await resetStoryState(createGroupDb);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, GROUP_PLATFORM_ADMINS.name);

    const createButton = await canvas.findByRole('button', { name: /create group/i });
    await user.click(createButton);

    await waitFor(async () => {
      const nameInput = document.getElementById('group-name');
      await expect(nameInput).toBeInTheDocument();
    });

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
    );

    await waitFor(() => {
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    await verifySuccessNotification();
    expect(await canvas.findByText('DevOps Team')).toBeInTheDocument();
  },
};

export const EditGroupFromList: Story = {
  name: 'Edit from list',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Groups');

    await waitFor(async () => {
      await expect(canvas.getByText(GROUP_SUPPORT_TEAM.name)).toBeInTheDocument();
      expect(canvas.queryByText('Customer Support Team')).not.toBeInTheDocument();
    });

    await openRowActionsMenu(user, canvas, GROUP_SUPPORT_TEAM.name);
    await clickMenuItem(user, 'Edit');

    await fillEditGroupModal(
      {
        name: 'Customer Support Team',
        description: 'Updated customer support access team',
      },
      true,
      user,
    );

    await verifySuccessNotification();
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    await canvas.findByText('Customer Support Team', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    expect(canvas.queryByText(GROUP_SUPPORT_TEAM.name)).not.toBeInTheDocument();
  },
};

export const EditGroupFromDetailPage: Story = {
  name: 'Edit from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, GROUP_SUPPORT_TEAM.name);

    const groupLink = canvas.getByRole('link', { name: GROUP_SUPPORT_TEAM.name });
    await user.click(groupLink);

    await waitFor(
      async () => {
        await expect(canvas.getByRole('heading', { name: GROUP_SUPPORT_TEAM.name })).toBeInTheDocument();
        expect(canvas.queryByRole('heading', { name: 'Customer Support Team' })).not.toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    await expect(canvas.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
    await expect(canvas.getByRole('tab', { name: /members/i })).toBeInTheDocument();

    await openDetailPageActionsMenu(user, canvas);
    await clickMenuItem(user, 'Edit');

    await fillEditGroupModal(
      {
        name: 'Customer Support Team',
        description: 'Updated customer support access team',
      },
      true,
      user,
    );

    await Promise.all([
      verifySuccessNotification(),
      waitFor(() => {
        const updatedHeading = canvas.queryByRole('heading', { name: 'Customer Support Team' });
        expect(updatedHeading).toBeInTheDocument();
        expect(canvas.queryByRole('heading', { name: GROUP_SUPPORT_TEAM.name })).not.toBeInTheDocument();
      }),
    ]);
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
  play: async (context) => {
    await resetStoryState(deleteGroupDb);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, GROUP_SUPPORT_TEAM.name);

    await openRowActionsMenu(user, canvas, GROUP_SUPPORT_TEAM.name);
    await clickMenuItem(user, 'Delete');
    await confirmDeleteModal(user, 'Remove group "Support Team"');

    await verifySuccessNotification();
    await waitFor(() => {
      const supportTeamElement = canvas.queryByText(GROUP_SUPPORT_TEAM.name);
      if (supportTeamElement) {
        throw new Error('Support Team group should have been deleted but was still found');
      }
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
  play: async (context) => {
    await resetStoryState(deleteGroupDb);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, GROUP_SUPPORT_TEAM.name);

    const groupLink = canvas.getByRole('link', { name: GROUP_SUPPORT_TEAM.name });
    await user.click(groupLink);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: GROUP_SUPPORT_TEAM.name })).toBeInTheDocument();
    });

    await expect(canvas.getByRole('tab', { name: /members/i })).toBeInTheDocument();
    const membersTab = canvas.getByRole('tab', { name: /members/i });
    await user.click(membersTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await waitFor(async () => {
      const actionsButton = canvas.queryByRole('button', { name: 'Actions' });
      const kebabMenu =
        document.getElementById('group-actions-dropdown') ||
        document.querySelector('button[id*="actions-dropdown"]') ||
        document.querySelector('[data-ouia-component-id="group-title-actions-dropdown"] button');

      if (actionsButton || kebabMenu) {
        expect(true).toBe(true);
      } else {
        const pageTitle = canvas.queryByRole('heading', { name: GROUP_SUPPORT_TEAM.name });
        expect(pageTitle).toBeInTheDocument();
      }
    });

    await openDetailPageActionsMenu(user, canvas);
    await clickMenuItem(user, 'Delete');
    await confirmDeleteModal(user, 'Remove group "Support Team"');

    await verifySuccessNotification();
    await waitFor(async () => {
      await expect(canvas.getByText(GROUP_PLATFORM_ADMINS.name)).toBeInTheDocument();
      await expect(canvas.getByText(GROUP_ENGINEERING.name)).toBeInTheDocument();
      expect(canvas.queryByText(GROUP_SUPPORT_TEAM.name)).not.toBeInTheDocument();
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
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState(addMembersDb);

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, GROUP_SUPPORT_TEAM.name);

    const groupLink = canvas.getByRole('link', { name: GROUP_SUPPORT_TEAM.name });
    await user.click(groupLink);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await canvas.findByRole('heading', { name: GROUP_SUPPORT_TEAM.name }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    const membersTab = canvas.getByRole('tab', { name: /members/i });
    await user.click(membersTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await delay(TEST_TIMEOUTS.AFTER_CLICK);
    const addMemberBtn = canvas.getByRole('button', { name: /add member/i });
    await user.click(addMemberBtn);

    await fillAddGroupMembersModal(user, [USER_JOHN.username, USER_JANE.username]);

    const body = within(document.body);
    await waitFor(
      async () => {
        const notification = body.getByText(/success adding members to group/i);
        await expect(notification).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    await waitFor(async () => {
      await expect(canvas.getByText(USER_JOHN.username)).toBeInTheDocument();
      await expect(canvas.getByText(USER_JANE.username)).toBeInTheDocument();
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
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState(removeMembersDb);

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, GROUP_PLATFORM_ADMINS.name);

    const groupLink = canvas.getByRole('link', { name: GROUP_PLATFORM_ADMINS.name });
    await user.click(groupLink);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: GROUP_PLATFORM_ADMINS.name })).toBeInTheDocument();
    });

    const membersTab = canvas.getByRole('tab', { name: /members/i });
    await user.click(membersTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    const memberCheckboxes = canvas.getAllByRole('checkbox');
    await user.click(memberCheckboxes[1]);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const bulkActionsBtn = canvas.getByRole('button', { name: 'Member bulk actions' });
    await user.click(bulkActionsBtn);

    const removeMenuItem = within(document.body).getByRole('menuitem', { name: 'Remove' });
    await user.click(removeMenuItem);

    const body = within(document.body);
    const modal = await body.findByRole('dialog', {}, { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT });
    expect(modal).toBeInTheDocument();

    const confirmRemoveBtn = within(modal).getByRole('button', { name: /remove/i });
    await user.click(confirmRemoveBtn);
    await waitFor(async () => {
      const notification = body.getByText(/success removing members from group/i);
      await expect(notification).toBeInTheDocument();
    });

    await waitFor(async () => {
      await expect(canvas.getByText(USER_JANE.username)).toBeInTheDocument();
      expect(canvas.queryByText(USER_JOHN.username)).not.toBeInTheDocument();
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
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState(addRolesDb);

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, GROUP_SUPPORT_TEAM.name);

    const groupLink = canvas.getByRole('link', { name: GROUP_SUPPORT_TEAM.name });
    await user.click(groupLink);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: GROUP_SUPPORT_TEAM.name })).toBeInTheDocument();
    });

    const rolesTab = canvas.getByRole('tab', { name: /roles/i });
    await user.click(rolesTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await waitFor(async () => {
      const addRoleBtn = canvas.queryByRole('button', { name: /add role/i });
      expect(addRoleBtn).toBeInTheDocument();
    });

    await delay(TEST_TIMEOUTS.LONG_OPERATION);

    await delay(TEST_TIMEOUTS.AFTER_CLICK);
    const addRoleBtnToClick = canvas.getByRole('button', { name: /add role/i });
    await expect(addRoleBtnToClick).toBeEnabled();
    await user.click(addRoleBtnToClick);

    await fillAddGroupRolesModal(user, GROUP_SUPPORT_TEAM.name, 2);

    const body = within(document.body);
    await waitFor(async () => {
      const notification = body.getByText(/success adding roles to group/i);
      await expect(notification).toBeInTheDocument();
    });

    await waitFor(async () => {
      await expect(canvas.getByText(V1_ROLE_ADMIN.name)).toBeInTheDocument();
      await expect(canvas.getByText(V1_ROLE_VIEWER.name)).toBeInTheDocument();
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
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState(removeRolesDb);

    await navigateToPage(user, canvas, 'Groups');
    await waitForPageToLoad(canvas, GROUP_PLATFORM_ADMINS.name);

    const groupLink = canvas.getByRole('link', { name: GROUP_PLATFORM_ADMINS.name });
    await user.click(groupLink);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: GROUP_PLATFORM_ADMINS.name })).toBeInTheDocument();
    });

    const rolesTab = canvas.getByRole('tab', { name: /roles/i });
    await user.click(rolesTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await waitFor(async () => {
      await expect(canvas.getByText(V1_ROLE_ADMIN.name)).toBeInTheDocument();
      await expect(canvas.getByText(V1_ROLE_VIEWER.name)).toBeInTheDocument();
    });

    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    const roleCheckbox = canvas.getByRole('checkbox', { name: /select row 0/i });
    await user.click(roleCheckbox);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await removeSelectedRolesFromGroup(user, canvas);

    const body = within(document.body);
    await waitFor(async () => {
      const notification = body.getByText(/success removing roles from group/i);
      await expect(notification).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(canvas.queryByText(V1_ROLE_ADMIN.name)).not.toBeInTheDocument();
      expect(canvas.queryByText(V1_ROLE_VIEWER.name)).toBeInTheDocument();
    });
  },
};
