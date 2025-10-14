import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
import { AppEntryWithRouter } from './_shared/components/AppEntryWithRouter';
import { ENVIRONMENTS } from './_shared/environments';
import {
  clickMenuItem,
  confirmDeleteModal,
  navigateToPage,
  openDetailPageActionsMenu,
  openRoleActionsMenu,
  openRowActionsMenu,
  resetStoryState,
  verifySuccessNotification,
  waitForPageToLoad,
} from './_shared/helpers';
import { fillEditGroupModal } from '../features/groups/EditGroupModal.helpers';
import { fillAddGroupWizardForm } from '../features/groups/add-group/AddGroupWizard.helpers';
import { fillAddGroupMembersModal } from '../features/groups/AddGroupMembers.helpers';
import { fillAddGroupRolesModal } from '../features/groups/AddGroupRoles.helpers';
import { removeSelectedRolesFromGroup } from '../features/groups/RemoveGroupRoles.helpers';
import { fillCreateRoleWizard } from '../features/roles/CreateRole.helpers';
import { fillEditRoleModal } from '../features/roles/EditRole.helpers';
import { confirmDeleteRoleModal } from '../features/roles/DeleteRole.helpers';
import { mockRoles, mockServiceAccounts, mockUsers } from '../features/groups/add-group/AddGroupWizard.mocks';
import { createStatefulHandlers } from '../../.storybook/helpers/stateful-handlers';
import { defaultGroups } from '../../.storybook/fixtures/groups';
import { defaultUsers } from '../../.storybook/fixtures/users';
import { defaultRoles } from '../../.storybook/fixtures/roles';
import { makeChrome } from './_shared/helpers/chrome';

type Story = StoryObj<typeof AppEntryWithRouter>;

/**
 * Create dynamic environment parameters based on story args
 * This allows Storybook controls to override feature flags and permissions
 */
function createDynamicEnvironment(args: any) {
  return {
    chrome: makeChrome({
      environment: 'prod',
      isOrgAdmin: args.orgAdmin ?? true,
      userAccessAdministrator: args.userAccessAdministrator ?? false,
    }),
    featureFlags: {
      'platform.rbac.workspaces': args['platform.rbac.workspaces'] ?? false,
      'platform.rbac.group-service-accounts': args['platform.rbac.group-service-accounts'] ?? false,
      'platform.rbac.group-service-accounts.stable': args['platform.rbac.group-service-accounts.stable'] ?? false,
      'platform.rbac.common-auth-model': args['platform.rbac.common-auth-model'] ?? true,
      'platform.rbac.common.userstable': args['platform.rbac.common.userstable'] ?? false,
    },
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
  };
}

const meta = {
  component: AppEntryWithRouter,
  title: 'User Journeys/Production Org Admin',
  tags: ['prod-org-admin'],
  decorators: [
    (Story: any, context: any) => {
      // Apply dynamic environment parameters based on current args
      const dynamicEnv = createDynamicEnvironment(context.args);
      // Replace parameters entirely instead of mutating to ensure React sees the change
      context.parameters = { ...context.parameters, ...dynamicEnv };
      return <Story />;
    },
  ],
  argTypes: {
    // Demo Controls
    typingDelay: {
      control: { type: 'number', min: 0, max: 100, step: 10 },
      description: 'Typing delay in ms for demo mode (0 = instant, 30 = realistic)',
      table: { category: 'Demo', defaultValue: { summary: '0 in CI, 30 otherwise' } },
    },
    // Permission Controls
    orgAdmin: {
      control: 'boolean',
      description: 'Organization Administrator - Full RBAC access',
      table: { category: 'Permissions', defaultValue: { summary: 'true' } },
    },
    userAccessAdministrator: {
      control: 'boolean',
      description: 'User Access Administrator - Can manage users and groups',
      table: { category: 'Permissions', defaultValue: { summary: 'false' } },
    },
    // Feature Flag Controls
    'platform.rbac.workspaces': {
      control: 'boolean',
      description: 'Enable Workspaces feature',
      table: { category: 'Feature Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.group-service-accounts': {
      control: 'boolean',
      description: 'Legacy service accounts flag (deprecated)',
      table: { category: 'Feature Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.group-service-accounts.stable': {
      control: 'boolean',
      description: 'Current service accounts flag',
      table: { category: 'Feature Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.common-auth-model': {
      control: 'boolean',
      description: 'Common Auth Model - Enables selectable users table',
      table: { category: 'Feature Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.common.userstable': {
      control: 'boolean',
      description: 'New unified users table with drawer',
      table: { category: 'Feature Flags', defaultValue: { summary: 'false' } },
    },
  },
  args: {
    // Default values (Production Org Admin environment)
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    // Note: orgAdmin, userAccessAdministrator, and feature flags are set via
    // parameters (permissions/featureFlags), not args, to allow story-level
    // overrides without control conflicts. Controls can still modify them.
  },
  parameters: {
    ...ENVIRONMENTS.PROD_ORG_ADMIN,
    docs: {
      description: {
        component: `
# Production: Org Admin Environment

This environment simulates a **production** RBAC instance with **Org Admin** privileges.

## Environment Configuration

- **User Role**: Organization Administrator
- **Permissions**: Full RBAC access (\`rbac:*:*\`)
- **Feature Flags**:
  - \`platform.rbac.group-service-accounts\`: false (legacy)
  - \`platform.rbac.group-service-accounts.stable\`: enabled (current)
  - \`platform.rbac.workspaces\`: false

## Available User Journeys

This environment tests complete end-to-end workflows for org admins in production:

### Group Management Journeys
- **Manual Testing**: Entry point for manual exploration and debugging
- **Create Group Journey**: Create groups with service accounts (current production state)
- **Edit Group From List**: Edit group metadata from the groups list page
- **Edit Group From Detail Page**: Edit group metadata from a group's detail page
- **Delete Group From List**: Delete groups from the groups list page
- **Delete Group From Detail Page**: Delete groups from a group's detail page

## Usage

All interactions are simulated with realistic timing (30ms typing delay, 200-300ms pauses) to provide a demo-like experience. API calls are mocked via MSW with stateful handlers.

State resets automatically on story replay using the replay button.
        `,
      },
    },
  },
};

export default meta;

/**
 * Manual Testing Entry Point with automated verification
 * Production environment uses its own manual testing story
 */
export const ManualTesting: Story = {
  name: 'Manual Testing',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
## Manual Testing Entry Point

This story provides an entry point for manual testing and exploration of the Production Org Admin environment.

### Environment Configuration

This environment is pre-configured with:
- Full admin permissions
- Production feature flags
- MSW handlers for API mocking
- Mock data for groups, users, and roles

### Automated Checks

This story includes automated verification:
- ✅ My User Access page loads successfully
- ✅ Roles table is displayed with data
- ✅ Specific roles like "Administrator" are present
- ✅ Navigation works correctly
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Verify we're on My User Access page
    await navigateToPage(user, canvas, 'My User Access');

    // Scope queries to main content area (not navigation)
    const mainElement = document.querySelector('main') || context.canvasElement;
    const mainContent = within(mainElement as HTMLElement);

    // Verify the page loaded - look for the unique subtitle text
    const subtitle = await mainContent.findByText(/select applications to view your personal/i);
    expect(subtitle).toBeInTheDocument();

    // Verify the table is present with actual data
    const table = await mainContent.findByRole('grid');
    expect(table).toBeInTheDocument();

    // Verify table has roles data (admin view)
    const tableContent = within(table);

    // Check for "Administrator" role (specific to production admin view)
    const adminRole = await tableContent.findByText(/^administrator$/i);
    expect(adminRole).toBeInTheDocument();

    // Verify at least one role row exists
    const tbody = tableContent.getAllByRole('rowgroup').find((rg) => rg.tagName === 'TBODY');
    expect(tbody).toBeInTheDocument();
    const dataRows = within(tbody!).getAllByRole('row');
    expect(dataRows.length).toBeGreaterThan(0);
  },
};

/**
 * Create Group Journey (With Service Accounts)
 *
 * Tests the full end-to-end group creation flow with service accounts step.
 * This represents the current production state with the service accounts feature enabled.
 *
 * Steps:
 * 1. Load groups list
 * 2. Click "Add group"
 * 3. Fill group name and description
 * 4. Select roles
 * 5. Select users
 * 6. Select service accounts
 * 7. Review and submit
 * 8. Verify success notification
 * 9. Verify new group appears in list
 */
export const CreateGroupJourney: Story = {
  name: 'Groups / Create new group',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    featureFlags: {
      'platform.rbac.group-service-accounts': false, // OLD feature flag, DO NOT USE
      'platform.rbac.group-service-accounts.stable': true, // current feature flag, used after isBeta deprecation
    },
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: mockUsers,
        roles: mockRoles,
        serviceAccounts: mockServiceAccounts,
      }),
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Platform Admins');

    // Click "Create group" to open wizard
    const createButton = await canvas.findByRole('button', { name: /create group/i });
    await user.click(createButton);

    // Wait for wizard to open
    await waitFor(async () => {
      const nameInput = document.getElementById('group-name');
      await expect(nameInput).toBeInTheDocument();
    });

    // Fill and submit the wizard
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

    // Wait for wizard to close
    await waitFor(() => {
      const wizard = document.querySelector('[role="dialog"]');
      expect(wizard).not.toBeInTheDocument();
    });

    // Verify success notification
    await verifySuccessNotification();
  },
};

/**
 * Edit Group Journey - From Groups List
 *
 * Tests the full end-to-end group editing flow from the groups list:
 * 1. Load groups list
 * 2. Click row actions menu (kebab menu) on a group
 * 3. Click "Edit"
 * 4. Edit modal opens with group data
 * 5. Change name and description
 * 6. Click Save
 * 7. Verify success notification
 * 8. Verify updated group name in the list
 *
 * This validates:
 * - Edit action from row menu
 * - Modal pre-population with existing data
 * - PUT API operation
 * - Form validation
 * - List refresh showing updated data
 */
export const EditGroupFromList: Story = {
  name: 'Groups / Edit from list',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: ENVIRONMENTS.PROD_ORG_ADMIN.msw.handlers,
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load with original unedited state
    await waitFor(async () => {
      await expect(canvas.getByText('Support Team')).toBeInTheDocument();
      expect(canvas.queryByText('Customer Support Team')).not.toBeInTheDocument();
    });

    // Open row actions menu and click Edit
    await openRowActionsMenu(user, canvas, 'Support Team');
    await clickMenuItem(user, 'Edit');

    // Fill and submit the edit modal
    await fillEditGroupModal(
      {
        name: 'Customer Support Team',
        description: 'Updated customer support access team',
      },
      true,
      user,
    );

    // Verify success and updated group name in list
    await verifySuccessNotification();
    await waitFor(() => {
      expect(canvas.getByText('Customer Support Team')).toBeInTheDocument();
      expect(canvas.queryByText('Support Team')).not.toBeInTheDocument();
    });
  },
};

/**
 * Edit Group Journey - From Group Detail Page
 *
 * Tests the full end-to-end group editing flow from a group's detail page:
 * 1. Navigate to group detail page - Members tab (Support Team)
 * 2. Click actions dropdown (kebab menu) in the page header
 * 3. Click "Edit" from the dropdown
 * 4. Edit modal opens with group data
 * 5. Change name and description
 * 6. Click Save
 * 7. Verify success notification
 * 8. Verify updated group name in header (stays on detail page)
 *
 * This validates:
 * - Edit action from detail page header
 * - Modal pre-population with existing data
 * - PUT API operation from detail page
 * - Page header updates after edit without navigation
 * - User stays on detail page after editing
 */
export const EditGroupFromDetailPage: Story = {
  name: 'Groups / Edit from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: ENVIRONMENTS.PROD_ORG_ADMIN.msw.handlers,
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Support Team');

    // Click on the "Support Team" link to navigate to detail page
    const groupLink = canvas.getByRole('link', { name: 'Support Team' });
    await user.click(groupLink);

    // Wait for group detail page to load with original unedited state
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Support Team' })).toBeInTheDocument();
      expect(canvas.queryByRole('heading', { name: 'Customer Support Team' })).not.toBeInTheDocument();
    }, { timeout: 10000 }); // Increased timeout to allow for API response

    // Verify we're on the detail page
    await expect(canvas.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
    await expect(canvas.getByRole('tab', { name: /members/i })).toBeInTheDocument();

    // Open detail page actions menu and click Edit
    await openDetailPageActionsMenu(user, canvas);
    await clickMenuItem(user, 'Edit');

    // Fill and submit the edit modal
    await fillEditGroupModal(
      {
        name: 'Customer Support Team',
        description: 'Updated customer support access team',
      },
      true,
      user,
    );

    // Wait for both notification and title update (happen simultaneously)
    await Promise.all([
      verifySuccessNotification(),
      waitFor(() => {
        const updatedHeading = canvas.queryByRole('heading', { name: 'Customer Support Team' });
        expect(updatedHeading).toBeInTheDocument();
        expect(canvas.queryByRole('heading', { name: 'Support Team' })).not.toBeInTheDocument();
      }),
    ]);
  },
};

/**
 * Delete Group Journey - From Groups List
 *
 * Tests the full end-to-end group deletion flow from the groups list:
 * 1. Load groups list with existing groups
 * 2. Click row actions menu (kebab menu) on a group
 * 3. Click "Delete"
 * 4. Confirmation modal appears
 * 5. Click "Remove" to confirm
 * 6. Verify success notification
 * 7. Verify group is removed from list
 *
 * This validates:
 * - Action menu functionality
 * - Confirmation modal pattern
 * - DELETE API operation
 * - List refresh after deletion
 */
export const DeleteGroupFromList: Story = {
  name: 'Groups / Delete from list',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups, // Start with existing groups
        users: mockUsers,
        roles: mockRoles,
      }),
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Support Team');

    // Open row actions menu and delete the group
    await openRowActionsMenu(user, canvas, 'Support Team');
    await clickMenuItem(user, 'Delete');
    await confirmDeleteModal(user, 'Remove group "Support Team"');

    // Verify success and group removal
    await verifySuccessNotification();
    await waitFor(() => {
      expect(canvas.queryByText('Support Team')).not.toBeInTheDocument();
    });
  },
};

/**
 * Delete Group Journey - From Group Detail Page
 *
 * Tests the full end-to-end group deletion flow from a group's detail page:
 * 1. Navigate to group detail page - Members tab (Support Team)
 * 2. Click actions dropdown (kebab menu) in the page header
 * 3. Click "Delete" from the dropdown
 * 4. Confirmation modal appears
 * 5. Click "Remove" to confirm
 * 6. Verify success notification
 * 7. Verify redirect to groups list
 * 8. Verify group is removed from list
 *
 * This validates:
 * - Detail page header action menu functionality
 * - Navigation flow from detail page to delete modal
 * - DELETE API operation from members tab
 * - Redirect to groups list after deletion
 * - List refresh showing deleted group is gone
 */
export const DeleteGroupFromDetailPage: Story = {
  name: 'Groups / Delete from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups, // Start with existing groups (includes group-2 = "Support Team")
        users: mockUsers,
        roles: mockRoles,
      }),
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Support Team');

    // Click on the "Support Team" link to navigate to detail page
    const groupLink = canvas.getByRole('link', { name: 'Support Team' });
    await user.click(groupLink);
    await delay(300);

    // Wait for group detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Support Team' })).toBeInTheDocument();
    });

    // Verify we're on the detail page and click Members tab to ensure we're on the right tab
    await expect(canvas.getByRole('tab', { name: /members/i })).toBeInTheDocument();
    const membersTab = canvas.getByRole('tab', { name: /members/i });
    await user.click(membersTab);
    await delay(300);

    // Wait for Actions button to be available before trying to interact with it
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
    });

    // Open detail page actions menu and delete the group
    await openDetailPageActionsMenu(user, canvas);
    await clickMenuItem(user, 'Delete');
    await confirmDeleteModal(user, 'Remove group "Support Team"');

    // Verify success and redirection to groups list
    await verifySuccessNotification();
    await waitFor(async () => {
      // Should show other groups in the list
      await expect(canvas.getByText('Platform Admins')).toBeInTheDocument();
      await expect(canvas.getByText('Engineering')).toBeInTheDocument();
      // But NOT the deleted group
      expect(canvas.queryByText('Support Team')).not.toBeInTheDocument();
    });
  },
};

/**
 * Add Members to Group Journey
 *
 * Tests adding members (users) to an existing group from the group detail page.
 *
 * Steps:
 * 1. Navigate to group detail page (Members tab)
 * 2. Click "Add member" button
 * 3. Select users from modal
 * 4. Click "Add to group"
 * 5. Verify success notification
 * 6. Verify members appear in the members list
 */
export const AddMembersToGroupJourney: Story = {
  name: 'Groups / Add members',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
        // group-2 (Support Team) starts with no members
      }),
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

    await resetStoryState();

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Support Team');

    // Click on the "Support Team" link to navigate to detail page
    const groupLink = canvas.getByRole('link', { name: 'Support Team' });
    await user.click(groupLink);
    await delay(300);

    // Step 1: Wait for group detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Support Team' })).toBeInTheDocument();
    });

    // Click Members tab
    const membersTab = canvas.getByRole('tab', { name: /members/i });
    await user.click(membersTab);
    await delay(300);

    // Step 2: Click "Add member" button
    await delay(300);
    const addMemberBtn = canvas.getByRole('button', { name: /add member/i });
    await user.click(addMemberBtn);

    // Step 3-4: Fill and submit the Add Members modal (uses helper for modal interaction)
    await fillAddGroupMembersModal(user, ['john.doe', 'jane.smith']);

    // Step 5: Verify success notification (notifications are rendered at document.body level)
    // Note: There are two notifications - "Adding members" (info) and "Success adding members" (success)
    const body = within(document.body);
    await waitFor(async () => {
      const notification = body.getByText(/success adding members to group/i);
      await expect(notification).toBeInTheDocument();
    });

    // Step 6: Verify members appear in the list
    await waitFor(async () => {
      await expect(canvas.getByText('john.doe')).toBeInTheDocument();
      await expect(canvas.getByText('jane.smith')).toBeInTheDocument();
    });
  },
};

/**
 * Remove Members from Group Journey
 *
 * Tests removing members (users) from an existing group.
 *
 * Steps:
 * 1. Navigate to group detail page (Members tab)
 * 2. Select member(s) to remove
 * 3. Click "Remove (#)" button
 * 4. Verify success notification
 * 5. Verify members are removed from the list
 */
export const RemoveMembersFromGroupJourney: Story = {
  name: 'Groups / Remove members',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
        // group-1 (Platform Admins) starts with john.doe and jane.smith as members
        groupMembers: new Map([['group-1', [defaultUsers[0], defaultUsers[1]]]]),
      }),
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

    await resetStoryState();

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Platform Admins');

    // Click on the "Platform Admins" link to navigate to detail page
    const groupLink = canvas.getByRole('link', { name: 'Platform Admins' });
    await user.click(groupLink);
    await delay(300);

    // Wait for group detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Platform Admins' })).toBeInTheDocument();
    });

    // Click Members tab
    const membersTab = canvas.getByRole('tab', { name: /members/i });
    await user.click(membersTab);
    await delay(300);

    // Wait for members table to load
    await delay(500);

    // Select first member checkbox
    const memberCheckbox = canvas.getByRole('checkbox', { name: /select row 0/i });
    await user.click(memberCheckbox);
    await delay(300);

    // Click "Remove (#)" button
    const removeBtn = canvas.getByRole('button', { name: /remove \(1\)/i });
    await user.click(removeBtn);

    // Verify success notification (notifications are rendered at document.body level)
    const body = within(document.body);
    await waitFor(async () => {
      const notification = body.getByText(/success removing members from group/i);
      await expect(notification).toBeInTheDocument();
    });

    // Verify the member is no longer in the list (table should have refreshed)
    await waitFor(async () => {
      // After removing first member (john.doe), only jane.smith should remain
      await expect(canvas.getByText('jane.smith')).toBeInTheDocument();
      expect(canvas.queryByText('john.doe')).not.toBeInTheDocument();
    });
  },
};

/**
 * Add Roles to Group Journey
 *
 * Tests adding roles to an existing group from the group detail page.
 *
 * Steps:
 * 1. Navigate to group detail page (Roles tab)
 * 2. Click "Add role" button
 * 3. Select roles from modal
 * 4. Click "Add to group"
 * 5. Verify success notification
 * 6. Verify roles appear in the roles list
 */
export const AddRolesToGroupJourney: Story = {
  name: 'Groups / Add roles',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
        // group-2 (Support Team) starts with no roles
      }),
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

    await resetStoryState();

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Support Team');

    // Click on the "Support Team" link to navigate to detail page
    const groupLink = canvas.getByRole('link', { name: 'Support Team' });
    await user.click(groupLink);
    await delay(300);

    // Step 1: Wait for group detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Support Team' })).toBeInTheDocument();
    });

    // Click Roles tab
    const rolesTab = canvas.getByRole('tab', { name: /roles/i });
    await user.click(rolesTab);
    await delay(300);

    // Step 2: Wait for roles tab to fully load
    // Wait for empty state message or roles to appear (group starts with no roles)
    await waitFor(async () => {
      // Either we see the empty state or the add button
      const addRoleBtn = canvas.queryByRole('button', { name: /add role/i });
      expect(addRoleBtn).toBeInTheDocument();
    });

    // Give the page time to fetch available roles count and enable the button
    await delay(2000);

    // Button should now be enabled - click it
    await delay(300);
    const addRoleBtnToClick = canvas.getByRole('button', { name: /add role/i });
    await expect(addRoleBtnToClick).toBeEnabled();
    await user.click(addRoleBtnToClick);

    // Step 3-4: Fill and submit the Add Roles modal (uses helper for modal interaction)
    await fillAddGroupRolesModal(user, 'Support Team', 2); // Select first 2 roles

    // Step 5: Verify success notification (notifications are rendered at document.body level)
    const body = within(document.body);
    await waitFor(async () => {
      const notification = body.getByText(/success adding roles to group/i);
      await expect(notification).toBeInTheDocument();
    });

    // Step 6: Verify roles appear in the list
    await waitFor(async () => {
      await expect(canvas.getByText('Administrator')).toBeInTheDocument();
      await expect(canvas.getByText('Viewer')).toBeInTheDocument();
    });
  },
};

/**
 * Remove Roles from Group Journey
 *
 * Tests removing roles from an existing group.
 *
 * Steps:
 * 1. Navigate to group detail page (Roles tab)
 * 2. Select role(s) to remove
 * 3. Click "Remove selected" button
 * 4. Verify success notification
 * 5. Verify roles are removed from the list
 */
export const RemoveRolesFromGroupJourney: Story = {
  name: 'Groups / Remove roles',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
        // group-1 (Platform Admins) starts with Administrator and Viewer roles
        groupRoles: new Map([['group-1', [defaultRoles[0], defaultRoles[1]]]]),
      }),
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

    await resetStoryState();

    // Navigate to Groups from My User Access
    await navigateToPage(user, canvas, 'Groups');

    // Wait for groups list to load
    await waitForPageToLoad(canvas, 'Platform Admins');

    // Click on the "Platform Admins" link to navigate to detail page
    const groupLink = canvas.getByRole('link', { name: 'Platform Admins' });
    await user.click(groupLink);
    await delay(300);

    // Wait for group detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Platform Admins' })).toBeInTheDocument();
    });

    // Click Roles tab
    const rolesTab = canvas.getByRole('tab', { name: /roles/i });
    await user.click(rolesTab);
    await delay(300);

    // Wait for roles tab content to load - verify roles appear
    await waitFor(async () => {
      await expect(canvas.getByText('Administrator')).toBeInTheDocument();
      await expect(canvas.getByText('Viewer')).toBeInTheDocument();
    });

    await delay(300);

    // Select first role checkbox
    const roleCheckbox = canvas.getByRole('checkbox', { name: /select row 0/i });
    await user.click(roleCheckbox);
    await delay(500);

    // Remove the selected role using the Actions dropdown
    await removeSelectedRolesFromGroup(user, canvas);

    // Verify success notification (notifications are rendered at document.body level)
    const body = within(document.body);
    await waitFor(async () => {
      const notification = body.getByText(/success removing roles from group/i);
      await expect(notification).toBeInTheDocument();
    });

    // Verify the role is removed from the list (component should refresh automatically)
    await waitFor(() => {
      // Verify Administrator is gone and only Viewer remains
      expect(canvas.queryByText('Administrator')).not.toBeInTheDocument();
      expect(canvas.queryByText('Viewer')).toBeInTheDocument();
    });
  },
};

/**
 * Create Role Journey
 *
 * Tests the full end-to-end role creation flow (simple path: create from scratch).
 *
 * Steps:
 * 1. Navigate to Roles page
 * 2. Click "Create role"
 * 3. Select "Create role from scratch"
 * 4. Enter role name
 * 5. Add permissions
 * 6. Review and submit
 * 7. Verify success screen
 * 8. Close wizard
 */
export const CreateRoleJourney: Story = {
  name: 'Roles / Create new role',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    chrome: ENVIRONMENTS.PROD_ORG_ADMIN.chrome,
    featureFlags: ENVIRONMENTS.PROD_ORG_ADMIN.featureFlags,
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Roles from My User Access
    await navigateToPage(user, canvas, 'Roles');

    // Wait for roles list to load
    await waitForPageToLoad(canvas, 'Viewer');

    // Click "Create role" button
    const createButton = await canvas.findByRole('button', { name: /create role/i });
    await user.click(createButton);
    await delay(500);

    // Fill and submit the wizard
    await fillCreateRoleWizard(user, 'Automation Test Role', 'A test custom role for automation', ['insights:*:*']);

    // Verify we're back on the roles list
    await waitForPageToLoad(canvas, 'Viewer');
  },
};

/**
 * Tests editing a role's name and description.
 *
 * Journey:
 * 1. Start on roles list
 * 2. Open kebab menu for a role
 * 3. Click "Edit"
 * 4. Update name and description
 * 5. Submit
 * 6. Verify success notification
 * 7. Verify role appears with new name in list
 */
export const EditRoleJourney: Story = {
  name: 'Roles / Edit role',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests the full flow of editing a role's name and description.

This story verifies:
- Role kebab menu and edit action
- Edit modal functionality
- Form validation
- PUT /api/rbac/v1/roles/:roleId API operation
- Success notification
- List refresh with updated data
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Roles from My User Access
    await navigateToPage(user, canvas, 'Roles');

    // Wait for roles list to load
    await waitForPageToLoad(canvas, 'Administrator');

    // Open the kebab menu for "Viewer" role and click "Edit"
    await openRoleActionsMenu(user, canvas, 'Viewer');
    await clickMenuItem(user, 'Edit');

    // Fill the edit role form
    await fillEditRoleModal(user, 'Updated Viewer Role', 'Updated description for viewer role');

    // Verify success notification
    await verifySuccessNotification();

    // Small delay for list to refresh
    await delay(500);

    // Verify the updated role appears in the list
    await waitFor(async () => {
      await expect(canvas.getByText('Updated Viewer Role')).toBeInTheDocument();
    });
  },
};

/**
 * Tests editing a role's name and description from the role detail page.
 *
 * Journey:
 * 1. Start on role detail page
 * 2. Open Actions dropdown
 * 3. Click "Edit"
 * 4. Update name and description
 * 5. Submit
 * 6. Verify success notification
 * 7. Verify page header updates with new name
 */
export const EditRoleFromDetailPage: Story = {
  name: 'Roles / Edit from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests the full flow of editing a role from its detail page.

This story verifies:
- Role detail page Actions dropdown
- Edit modal functionality from detail page
- Form validation
- PUT /api/rbac/v1/roles/:roleId API operation
- Success notification
- Page header refresh with updated name without navigation
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Roles from My User Access
    await navigateToPage(user, canvas, 'Roles');

    // Wait for roles list to load
    await waitForPageToLoad(canvas, 'Custom Role');

    // Click on the "Custom Role" link to navigate to detail page
    const roleLink = canvas.getByRole('link', { name: 'Custom Role' });
    await user.click(roleLink);
    await delay(300);

    // Wait for role detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Custom Role' })).toBeInTheDocument();
    });

    // Open the Actions dropdown and click "Edit"
    await openDetailPageActionsMenu(user, canvas);
    await clickMenuItem(user, 'Edit');

    // Fill the edit role form
    await fillEditRoleModal(user, 'Updated Custom Role', 'Updated from detail page');

    // Verify success notification and header update in parallel
    await Promise.all([
      verifySuccessNotification(),
      // Wait for the header to update
      waitFor(async () => {
        await expect(canvas.getByRole('heading', { name: 'Updated Custom Role' })).toBeInTheDocument();
      }),
    ]);
  },
};

/**
 * Tests deleting a role from the roles list.
 *
 * Journey:
 * 1. Start on roles list
 * 2. Open kebab menu for a role
 * 3. Click "Delete"
 * 4. Confirm deletion
 * 5. Verify success notification
 * 6. Verify role is removed from list
 */
export const DeleteRoleFromList: Story = {
  name: 'Roles / Delete role',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests the full flow of deleting a role from the roles list.

This story verifies:
- Role kebab menu and delete action
- Delete confirmation modal with checkbox
- DELETE /api/rbac/v1/roles/:roleId API operation
- Success notification
- List refresh without deleted role
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Roles from My User Access
    await navigateToPage(user, canvas, 'Roles');

    // Wait for roles list to load
    await waitForPageToLoad(canvas, 'Administrator');

    // Open the kebab menu for "Viewer" role and click "Delete"
    await openRoleActionsMenu(user, canvas, 'Viewer');
    await clickMenuItem(user, 'Delete');

    // Confirm deletion in modal
    await confirmDeleteRoleModal(user);

    // Verify success notification
    await verifySuccessNotification();

    // Verify the role is removed from the list
    await waitFor(() => {
      expect(canvas.queryByText('Viewer')).not.toBeInTheDocument();
      // Administrator should still be there
      expect(canvas.getByText('Administrator')).toBeInTheDocument();
    });
  },
};

/**
 * Tests deleting a role from the role detail page.
 *
 * Journey:
 * 1. Start on role detail page
 * 2. Open Actions dropdown
 * 3. Click "Delete"
 * 4. Confirm deletion
 * 5. Verify success notification
 * 6. Verify redirect to roles list
 * 7. Verify role is removed from list
 */
export const DeleteRoleFromDetailPage: Story = {
  name: 'Roles / Delete from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: createStatefulHandlers({
        groups: defaultGroups,
        users: defaultUsers,
        roles: defaultRoles,
      }),
    },
    docs: {
      description: {
        story: `
Tests the full flow of deleting a role from its detail page.

This story verifies:
- Role detail page Actions dropdown
- Delete confirmation modal
- DELETE /api/rbac/v1/roles/:roleId API operation
- Success notification
- Redirect to roles list after deletion
- List refresh without deleted role
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Roles from My User Access
    await navigateToPage(user, canvas, 'Roles');

    // Wait for roles list to load
    await waitForPageToLoad(canvas, 'Custom Role');

    // Click on the "Custom Role" link to navigate to detail page
    const roleLink = canvas.getByRole('link', { name: 'Custom Role' });
    await user.click(roleLink);
    await delay(300);

    // Wait for role detail page to load
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'Custom Role' })).toBeInTheDocument();
    });

    // Open the Actions dropdown and click "Delete"
    await openDetailPageActionsMenu(user, canvas);
    await clickMenuItem(user, 'Delete');

    // Confirm deletion in modal
    await confirmDeleteRoleModal(user);

    // Verify success notification
    await verifySuccessNotification();

    // Wait for redirect to roles list
    await waitForPageToLoad(canvas, 'Administrator');

    // Verify the deleted role is not in the list
    await waitFor(() => {
      expect(canvas.queryByText('Custom Role')).not.toBeInTheDocument();
      expect(canvas.getByText('Administrator')).toBeInTheDocument();
    });
  },
};

// Helper: Navigate to a user's detail page
async function navigateToUserDetailPage(user: any, canvas: any, username: string) {
  // Navigate to Users from My User Access
  await navigateToPage(user, canvas, 'Users');

  // Wait for users list to load
  await waitForPageToLoad(canvas, username);

  // Verify status toggles are present (multiple users)
  const statusToggles = canvas.getAllByTestId('user-status-toggle');
  expect(statusToggles.length).toBeGreaterThan(0);

  // Click on the username to navigate to detail page
  const usernameLink = canvas.getByRole('link', { name: username });
  await user.click(usernameLink);
  await delay(500);

  // Wait for user detail page to load - look for the "Add user to a group" button
  await waitForPageToLoad(canvas, 'Add user to a group');
}

/**
 * Users / View user detail page
 *
 * Tests navigating to a user's detail page from the users list.
 *
 * Journey:
 * 1. Start on My User Access page
 * 2. Navigate to Users page via sidebar
 * 3. Click on a username link to open detail page
 * 4. Verify user detail page loads with user information
 * 5. Verify tabs (Groups, Roles) are present
 */
export const ViewUserDetailPageJourney: Story = {
  name: 'Users / View user detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests navigating to a user detail page from the users list.

**What this tests:**
- Users list rendering with all users
- Username links navigation
- User detail page loading
- User information display
- Tabs navigation (Groups, Roles)

**Covered interactions:**
- Sidebar navigation
- Table link clicks
- Page navigation
- Data loading states
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToUserDetailPage(user, canvas, 'john.doe');
  },
};

/**
 * Users / Add user to group from detail page
 *
 * Tests adding a user to groups from their detail page.
 *
 * Journey:
 * 1. Start on My User Access page
 * 2. Navigate to Users page via sidebar
 * 3. Click on a username to open detail page
 * 4. Click "Add user to a group" button
 * 5. Select groups in the modal
 * 6. Submit and verify success
 */
export const AddUserToGroupFromDetailPageJourney: Story = {
  name: 'Users / Add user to group from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests adding a user to groups from the user detail page.

**What this tests:**
- User detail page navigation
- "Add user to a group" button functionality
- Group selection modal
- Success notification

**Covered interactions:**
- Navigation through username link
- Button clicks
- Modal interaction
- Group selection
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to user detail page
    await navigateToUserDetailPage(user, canvas, 'john.doe');

    // Click "Add user to a group" button
    const addToGroupButton = await canvas.findByRole('button', { name: /add user to a group/i });
    await user.click(addToGroupButton);
    await delay(500);

    // Modal should open - find it in document body
    const modal = await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      return dialog as HTMLElement;
    });

    const modalContent = within(modal);

    // Wait for groups to load and select one
    await modalContent.findByText('Platform Admins');
    const groupCheckbox = modalContent.getByRole('checkbox', { name: /select row 0/i });
    await user.click(groupCheckbox);
    await delay(200);

    // Submit - button has aria-label="Save"
    const addButton = modalContent.getByRole('button', { name: 'Save' });
    await user.click(addButton);
    await delay(300);

    // Verify success notification
    await verifySuccessNotification();
  },
};

/**
 * Users / Deactivate user
 *
 * Tests deactivating an active user from the users list.
 *
 * Journey:
 * 1. Start on My User Access page
 * 2. Navigate to Users page
 * 3. Select an active user
 * 4. Open kebab menu and click "Deactivate users"
 * 5. Confirm action
 * 6. Verify success notification
 */
export const DeactivateUserJourney: Story = {
  name: 'Users / Deactivate user',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests deactivating users from the users list.

**What this tests:**
- User selection in the table
- Kebab menu actions
- Deactivate users action
- Confirmation modal
- Success notification

**Covered interactions:**
- Table checkbox selection
- Kebab menu navigation
- Modal confirmation
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Users
    await navigateToPage(user, canvas, 'Users');
    await waitForPageToLoad(canvas, 'john.doe');

    // Select an active user (john.doe - row 0)
    const userCheckbox = canvas.getByRole('checkbox', { name: 'Select row 0' });
    await user.click(userCheckbox);
    await delay(200);

    // Open kebab menu
    const kebabButton = canvas.getByRole('button', { name: /kebab dropdown toggle/i });
    await user.click(kebabButton);
    await delay(300);

    // Click "Deactivate users" option
    await clickMenuItem(user, 'Deactivate users');
    await delay(500);

    // Modal opens - check the confirmation checkbox first
    const modal = await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      return dialog as HTMLElement;
    });

    const modalContent = within(modal);

    // Check the confirmation checkbox
    const confirmCheckbox = modalContent.getByRole('checkbox', { name: /yes, i confirm that i want to deactivate these users/i });
    await user.click(confirmCheckbox);
    await delay(300);

    // Now click the Deactivate button (should be enabled now)
    const deactivateButton = modalContent.getByRole('button', { name: /deactivate user/i });
    await user.click(deactivateButton);
    await delay(300);

    // Verify success notification
    await verifySuccessNotification();
  },
};

/**
 * Users / Activate user
 *
 * Tests activating an inactive user from the users list.
 *
 * Journey:
 * 1. Start on My User Access page
 * 2. Navigate to Users page
 * 3. Select an inactive user
 * 4. Open kebab menu and click "Activate users"
 * 5. Confirm action
 * 6. Verify success notification
 */
export const ActivateUserJourney: Story = {
  name: 'Users / Activate user',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests activating inactive users from the users list.

**What this tests:**
- User selection in the table
- Kebab menu actions
- Activate users action
- Confirmation modal
- Success notification

**Covered interactions:**
- Table checkbox selection
- Kebab menu navigation
- Modal confirmation
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Users
    await navigateToPage(user, canvas, 'Users');
    await waitForPageToLoad(canvas, 'john.doe');

    // Select an inactive user (bob.johnson - row 2)
    const userCheckbox = canvas.getByRole('checkbox', { name: 'Select row 2' });
    await user.click(userCheckbox);
    await delay(200);

    // Open kebab menu
    const kebabButton = canvas.getByRole('button', { name: /kebab dropdown toggle/i });
    await user.click(kebabButton);
    await delay(300);

    // Click "Activate users" option
    await clickMenuItem(user, 'Activate users');
    await delay(500);

    // Modal opens - check the confirmation checkbox first
    const modal = await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      return dialog as HTMLElement;
    });

    const modalContent = within(modal);

    // Check the confirmation checkbox
    const confirmCheckbox = modalContent.getByRole('checkbox', { name: /yes, i confirm that i want to add these users/i });
    await user.click(confirmCheckbox);
    await delay(300);

    // Now click the Activate button (should be enabled now)
    const activateButton = modalContent.getByRole('button', { name: /activate user/i });
    await user.click(activateButton);
    await delay(300);

    // Verify success notification
    await verifySuccessNotification();
  },
};

/**
 * Users / Invite users
 *
 * Tests the user invitation flow from the users list.
 *
 * Journey:
 * 1. Start on My User Access page
 * 2. Navigate to Users page
 * 3. Click "Invite users" button
 * 4. Fill in email addresses
 * 5. Optionally add a message and check org admin checkbox
 * 6. Submit the invitation
 * 7. Verify success notification
 */
export const InviteUsersJourney: Story = {
  name: 'Users / Invite users',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests inviting new users to the organization.

**What this tests:**
- Navigating to invite users modal
- Email input validation (required field)
- Optional message field
- Optional org admin checkbox
- Form submission
- Success notification

**Covered interactions:**
- Button clicks
- Text input in textarea
- Checkbox interaction
- Form submission
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Navigate to Users
    await navigateToPage(user, canvas, 'Users');
    await waitForPageToLoad(canvas, 'john.doe');

    // Click "Invite users" button
    const inviteButton = canvas.getByRole('button', { name: /invite users/i });
    await user.click(inviteButton);
    await delay(500);

    // Modal should open
    const modal = await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      return dialog as HTMLElement;
    });

    const modalContent = within(modal);

    // Wait for modal title (use heading role to avoid conflict with button text)
    await modalContent.findByRole('heading', { name: /invite new users/i });

    // Fill in email addresses (required field)
    const emailInput = modalContent.getByRole('textbox', { name: /enter the e-mail addresses/i });
    await user.type(emailInput, 'newuser1@example.com, newuser2@example.com');
    await delay(300);

    // Optionally add a message
    const messageInput = modalContent.getByRole('textbox', { name: /send a message with the invite/i });
    await user.type(messageInput, 'Welcome to our organization!');
    await delay(300);

    // Check the org admin checkbox
    const orgAdminCheckbox = modalContent.getByRole('checkbox', { name: /organization administrators/i });
    await user.click(orgAdminCheckbox);
    await delay(300);

    // Submit the form
    const submitButton = modalContent.getByRole('button', { name: /invite new users/i });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);
    await delay(300);

    // Verify success notification
    await verifySuccessNotification();
  },
};
